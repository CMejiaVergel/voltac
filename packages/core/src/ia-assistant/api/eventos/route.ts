import { NextResponse } from "next/server";
import { crearTarea } from "../../../tareas/acciones";
import { getDB } from "../../../db";

/**
 * Lo que el asistente de WhatsApp le cuenta al CRM.
 *
 * Es la mitad de vuelta de la integración: el panel le pide al asistente que
 * contacte a alguien, y el asistente informa por aquí de todo lo que pasa
 * después —que el prospecto respondió, que quedó reunión, que hubo que llamar a
 * una persona—. Sin esto el CRM se quedaría con la foto del día que se envió el
 * primer mensaje.
 *
 * Cada evento deja **dos rastros**: una nota en el hilo del lead, que es lo que
 * lee el equipo comercial, y un movimiento de etapa, que es lo que mueve el
 * embudo. La nota siempre se escribe; la etapa solo cuando corresponde.
 *
 * Se autentica con `api_keys` porque es código llamando a código, igual que la
 * ingesta de prospectos. No hay sesión de usuario detrás de una notificación
 * que llega mientras nadie mira la pantalla.
 */

type TipoEvento =
  | "contactado"
  | "respondio"
  | "reunion_agendada"
  | "escalado"
  | "sin_respuesta";

interface Evento {
  crmId: number;
  tipo: TipoEvento;
  nota: string;
  datos?: Record<string, unknown>;
  at?: number;
}

/**
 * Traducción de un vocabulario al otro.
 *
 * El asistente piensa en toques y respuestas; el CRM piensa en etapas del
 * embudo. `stage: null` significa "no la muevas": un seguimiento o un
 * escalamiento no hacen avanzar a nadie en el embudo, y sobrescribir una etapa
 * que alguien puso a mano sería peor que no tocar nada.
 */
const TRANSICIONES: Record<TipoEvento, { stage: string | null; status: string | null }> = {
  contactado: { stage: "Contactado", status: "Esperando respuesta" },
  respondio: { stage: "En análisis", status: "Requiere seguimiento" },
  reunion_agendada: { stage: "En análisis", status: "Requiere seguimiento" },
  escalado: { stage: null, status: "Requiere seguimiento" },
  sin_respuesta: { stage: null, status: "Requiere seguimiento" },
};

/** Etapas que el asistente no debe pisar hacia atrás. */
const ETAPAS_CERRADAS = ["Propuesta enviada", "Negociación", "Ganado", "Perdido"];

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
      return NextResponse.json({ error: "401 Unauthorized" }, { status: 401 });
    }

    const evento = (await req.json()) as Evento;

    if (!evento?.crmId || !evento?.tipo || !evento?.nota) {
      return NextResponse.json(
        { error: "Faltan crmId, tipo o nota" },
        { status: 400 },
      );
    }
    if (!(evento.tipo in TRANSICIONES)) {
      return NextResponse.json({ error: `Tipo desconocido: ${evento.tipo}` }, { status: 400 });
    }

    const lead = await db.get("SELECT id, stage, status FROM quotes WHERE id = ?", [evento.crmId]);
    if (!lead) {
      // 404 y no 500: el asistente trata los 4xx como definitivos y deja de
      // reintentar, que es justo lo que corresponde con un lead borrado.
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    await db.run(
      "INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 1)",
      [evento.crmId, evento.nota, "Asistente WhatsApp"],
    );

    /*
     * Un escalamiento deja tarea, no solo una nota.
     *
     * El asistente pasa la conversación a una persona y se calla. Hasta aquí
     * eso quedaba como una nota en la ficha y un cambio de estado: informativo,
     * pero de nadie. Un prospecto esperando a que alguien retome se enfría en
     * minutos, así que es la tarea más urgente de las tres.
     */
    if (evento.tipo === "escalado") {
      await crearTarea({
        tipo: "escalamiento",
        titulo: `Retomar la conversación con ${lead.fullName}`,
        detalle: evento.nota,
        quoteId: evento.crmId,
        conversationId:
          typeof evento.datos?.conversationId === "string" ? evento.datos.conversationId : null,
      });
    }

    const { stage, status } = TRANSICIONES[evento.tipo];
    const cambios: string[] = [];
    const valores: unknown[] = [];

    /*
     * Una etapa avanzada no retrocede.
     *
     * El caso real: a un lead en "Negociación" el asistente le manda el
     * seguimiento pendiente, o la persona responde un mensaje viejo. Sin esta
     * guarda el lead volvería a "Contactado" y el embudo mostraría como fría
     * una negociación que está caliente. Lo mismo con "Perdido": si alguien lo
     * cerró a mano, un mensaje tardío no puede reabrirlo solo.
     */
    if (stage && !ETAPAS_CERRADAS.includes(lead.stage)) {
      cambios.push("stage = ?");
      valores.push(stage);
    }
    if (status) {
      cambios.push("status = ?");
      valores.push(status);
    }

    if (cambios.length) {
      valores.push(evento.crmId);
      await db.run(`UPDATE quotes SET ${cambios.join(", ")} WHERE id = ?`, valores);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
