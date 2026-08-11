"use server";

import { revalidatePath } from "next/cache";
import { getDB } from "../db";
import { sesionActual } from "../sesion";
import { calificarProspecto, type CalificacionProspecto, type SenalesProspecto } from "./calificacion";
import { dimensionar, type EntradaDimensionamiento, type ResultadoDimensionamiento } from "./motor";

export interface ResultadoAccion<T> {
  ok: boolean;
  error?: string;
  datos?: T;
}

export interface EstudioGuardado {
  id: number;
  leadId: number | null;
  leadNombre: string | null;
  titulo: string;
  entrada: EntradaDimensionamiento;
  resultado: ResultadoDimensionamiento;
  calificacion: CalificacionProspecto | null;
  origen: string;
  notas: string | null;
  creadoPor: string | null;
  creadoEn: string;
}

/**
 * Calcula sin guardar nada.
 *
 * Es una acción de servidor y no una función del cliente por una razón: el
 * navegador nunca ve los precios. Si el motor corriera en el cliente, la tabla
 * de precios de Voltac viajaría dentro del paquete de JavaScript y cualquiera
 * con las herramientas de desarrollo abiertas tendría el margen de la empresa.
 */
export async function calcular(
  entrada: EntradaDimensionamiento,
  senales?: Omit<SenalesProspecto, "resultado">,
): Promise<ResultadoAccion<{ resultado: ResultadoDimensionamiento; calificacion: CalificacionProspecto }>> {
  const problema = validar(entrada);
  if (problema) return { ok: false, error: problema };

  try {
    const resultado = dimensionar(entrada);
    const calificacion = calificarProspecto({ resultado, ...senales });
    return { ok: true, datos: { resultado, calificacion } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo calcular." };
  }
}

/**
 * Guarda el estudio con el resultado ya congelado.
 *
 * No se guardan solo los datos de entrada. Si mañana cambia un precio, este
 * estudio tiene que seguir diciendo lo que se le dijo al cliente: una
 * cotización que se recalcula sola después de enviada no es una cotización.
 */
export async function guardarEstudio(p: {
  entrada: EntradaDimensionamiento;
  senales?: Omit<SenalesProspecto, "resultado">;
  titulo?: string;
  leadId?: number | null;
  notas?: string;
  origen?: string;
}): Promise<ResultadoAccion<{ id: number }>> {
  const problema = validar(p.entrada);
  if (problema) return { ok: false, error: problema };

  try {
    const resultado = dimensionar(p.entrada);
    const calificacion = calificarProspecto({ resultado, ...p.senales });
    const sesion = await sesionActual();

    const titulo =
      p.titulo?.trim() ||
      `${resultado.sistema.potenciaKwp} kWp · ${resultado.entrada.consumoMensualKwh.toLocaleString("es-CO")} kWh/mes`;

    const db = await getDB();
    const r = await db.run(
      `INSERT INTO estudios_dimensionamiento
         (lead_id, titulo, entrada, resultado, calificacion, origen, notas, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.leadId ?? null,
        titulo,
        JSON.stringify(p.entrada),
        JSON.stringify(resultado),
        JSON.stringify(calificacion),
        p.origen ?? "panel",
        p.notas ?? null,
        sesion?.sub ?? null,
      ],
    );

    revalidatePath("/admin/dimensionamiento");
    return { ok: true, datos: { id: r.lastID as number } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar el estudio." };
  }
}

export async function listarEstudios(limite = 50): Promise<EstudioGuardado[]> {
  const db = await getDB();
  const filas = await db.all(
    `SELECT e.*, q.fullName AS lead_nombre
       FROM estudios_dimensionamiento e
       LEFT JOIN quotes q ON q.id = e.lead_id
      ORDER BY e.creado_en DESC
      LIMIT ?`,
    [limite],
  );
  return filas.map(mapear);
}

export async function leerEstudio(id: number): Promise<EstudioGuardado | null> {
  const db = await getDB();
  const fila = await db.get(
    `SELECT e.*, q.fullName AS lead_nombre
       FROM estudios_dimensionamiento e
       LEFT JOIN quotes q ON q.id = e.lead_id
      WHERE e.id = ?`,
    [id],
  );
  return fila ? mapear(fila) : null;
}

export async function eliminarEstudio(id: number): Promise<ResultadoAccion<null>> {
  try {
    const db = await getDB();
    await db.run("DELETE FROM estudios_dimensionamiento WHERE id = ?", [id]);
    revalidatePath("/admin/dimensionamiento");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo eliminar." };
  }
}

/**
 * Prospectos a los que se puede asociar un estudio.
 *
 * `SELECT *` y no una lista de columnas, a propósito. La tabla `quotes` **no
 * tiene la misma forma en las dos marcas**: la de Energy nació antes y con
 * otras columnas —`modality`, `consumption`, `installType`, `gridType`— y no
 * tiene `company`. Pedirla por nombre tumbaba la página entera con un
 * "no such column", que es exactamente lo que pasó.
 *
 * El resto del panel de Energy ya hacía `SELECT *` por esta misma razón. Lo que
 * falta se lee como ausente en vez de reventar.
 */
export async function listarLeads(): Promise<
  { id: number; nombre: string; empresa: string | null; consumoKwh: number | null }[]
> {
  const db = await getDB();
  const filas = await db.all(
    `SELECT * FROM quotes
      WHERE (isDeleted = 0 OR isDeleted IS NULL)
      ORDER BY id DESC
      LIMIT 200`,
  );
  return filas.map((f: any) => ({
    id: f.id,
    nombre: f.fullName ?? `Prospecto ${f.id}`,
    // En Systems es `company`; en Energy no existe y el equivalente más útil es
    // dónde queda la instalación.
    empresa: f.company ?? f.location ?? f.address ?? null,
    // Energy pregunta el consumo en el formulario de cotización. Si está, sirve
    // para no tener que volver a pedírselo al prospecto.
    consumoKwh: Number.isFinite(Number(f.consumption)) && Number(f.consumption) > 0
      ? Number(f.consumption)
      : null,
  }));
}

function mapear(f: any): EstudioGuardado {
  return {
    id: f.id,
    leadId: f.lead_id ?? null,
    leadNombre: f.lead_nombre ?? null,
    titulo: f.titulo,
    entrada: JSON.parse(f.entrada),
    resultado: JSON.parse(f.resultado),
    calificacion: f.calificacion ? JSON.parse(f.calificacion) : null,
    origen: f.origen,
    notas: f.notas ?? null,
    creadoPor: f.creado_por ?? null,
    creadoEn: f.creado_en,
  };
}

/**
 * Los dos datos que no se pueden inventar.
 *
 * El motor tolera casi cualquier cosa —recorta, ajusta y sigue— y eso está bien
 * para que no explote, pero aquí conviene parar antes: un consumo o una tarifa
 * absurdos producen un estudio que parece serio y no lo es, y esa es una cifra
 * que puede terminar delante de un cliente.
 */
function validar(e: EntradaDimensionamiento): string | null {
  if (!Number.isFinite(e.consumoMensualKwh) || e.consumoMensualKwh <= 0) {
    return "El consumo mensual tiene que ser mayor que cero.";
  }
  if (e.consumoMensualKwh > 2_000_000) {
    return "Ese consumo está fuera del rango de la herramienta. Un proyecto de esa escala necesita ingeniería de detalle.";
  }
  if (!Number.isFinite(e.precioKwh) || e.precioKwh <= 0) {
    return "El precio del kWh tiene que ser mayor que cero.";
  }
  // En Colombia el CU ronda los 500-1.200 pesos. Un valor de tres cifras de
  // más suele ser el TOTAL de la factura escrito en la casilla equivocada.
  if (e.precioKwh > 5_000) {
    return `$${Math.round(e.precioKwh).toLocaleString("es-CO")} por kWh no es una tarifa real en Colombia (van de $400 a $1.500). Revisa si pusiste el total de la factura en vez del costo unitario.`;
  }
  return null;
}
