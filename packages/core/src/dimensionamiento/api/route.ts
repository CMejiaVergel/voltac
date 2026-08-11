import { NextResponse } from "next/server";
import { getDB } from "../../db";
import { calificarProspecto } from "../calificacion";
import { dimensionar, type EntradaDimensionamiento } from "../motor";

/**
 * Dimensionamiento para el asistente de WhatsApp.
 *
 * Es el mismo motor que usa el módulo del panel, y esa es toda la razón de que
 * esta ruta exista. El asistente podría hacer la cuenta él solo —sabe
 * multiplicar— pero un modelo de lenguaje no da el mismo número dos veces:
 * pregúntale tres veces cuánto cuesta un sistema para 800 kWh y salen tres
 * cifras parecidas y distintas. Aquí la cifra que se le dice a un cliente por
 * chat y la que ve el asesor al abrir el panel son la misma, por construcción.
 *
 * Cada consulta se guarda como estudio con `origen: 'asistente'`. No es
 * auditoría por gusto: cuando el prospecto llame preguntando por "los treinta
 * millones que me dijeron", tiene que haber dónde mirar qué se le dijo y con
 * qué datos.
 *
 * Se autentica con `api_keys`, igual que la ingesta de prospectos y los eventos
 * del asistente: es código llamando a código, de madrugada y sin nadie con
 * sesión abierta.
 */

interface Cuerpo {
  entrada: EntradaDimensionamiento;
  senales?: {
    esPropietario?: boolean;
    preguntoFinanciacion?: boolean;
    pidioCotizacion?: boolean;
    cuandoLoHaria?: "ya" | "este-ano" | "explorando";
  };
  /** Para poder rastrear después qué se le dijo a quién. */
  conversationId?: string;
}

async function claveValida(req: Request, db: any): Promise<boolean> {
  const cabecera = req.headers.get("authorization") ?? "";
  if (!cabecera.startsWith("Bearer ")) return false;
  const clave = cabecera.slice(7);
  if (!clave) return false;
  const fila = await db.get("SELECT id FROM api_keys WHERE key = ?", [clave]);
  return Boolean(fila);
}

export async function POST(req: Request) {
  try {
    const db = await getDB();
    if (!(await claveValida(req, db))) {
      return NextResponse.json({ ok: false, error: "401 Unauthorized" }, { status: 401 });
    }

    const cuerpo = (await req.json()) as Cuerpo;
    const e = cuerpo?.entrada;

    if (!e || !Number.isFinite(e.consumoMensualKwh) || e.consumoMensualKwh <= 0) {
      return NextResponse.json(
        { ok: false, error: "falta el consumo mensual en kWh" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(e.precioKwh) || e.precioKwh <= 0) {
      return NextResponse.json({ ok: false, error: "falta el precio del kWh" }, { status: 400 });
    }
    /*
     * El error más probable del asistente, con diferencia: el cliente dice "pago
     * 400 mil al mes" y el modelo mete 400000 en la casilla del kWh. Sin este
     * freno el prospecto recibe por WhatsApp un retorno de tres meses, se
     * entusiasma, y alguien tiene que desdecirlo después.
     */
    if (e.precioKwh > 5_000) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `${Math.round(e.precioKwh)} pesos por kWh no es una tarifa real en Colombia (van de 400 a 1500). ` +
            "Parece el total de la factura y no el costo unitario. Preguntale al cliente cuantos kWh consume " +
            "y cuanto paga, y divide.",
        },
        { status: 400 },
      );
    }

    const resultado = dimensionar(e);
    const calificacion = calificarProspecto({ resultado, ...cuerpo.senales });

    /*
     * Guardar no puede tumbar la respuesta. Si la base falla, el asistente
     * todavía tiene un cálculo válido que darle al cliente y perder el registro
     * es mucho menos grave que dejarlo sin responder a mitad de conversación.
     */
    try {
      await db.run(
        `INSERT INTO estudios_dimensionamiento
           (lead_id, titulo, entrada, resultado, calificacion, origen, notas, creado_por)
         VALUES (?, ?, ?, ?, ?, 'asistente', ?, 'asistente-whatsapp')`,
        [
          null,
          `${resultado.sistema.potenciaKwp} kWp · ${e.consumoMensualKwh.toLocaleString("es-CO")} kWh/mes`,
          JSON.stringify(e),
          JSON.stringify(resultado),
          JSON.stringify(calificacion),
          cuerpo.conversationId ? `Conversación ${cuerpo.conversationId}` : null,
        ],
      );
    } catch (err) {
      console.error("No se pudo registrar el estudio del asistente:", err);
    }

    return NextResponse.json({ ok: true, datos: { resultado, calificacion } });
  } catch (err) {
    console.error("Fallo en /api/dimensionamiento:", err);
    return NextResponse.json({ ok: false, error: "error interno" }, { status: 500 });
  }
}
