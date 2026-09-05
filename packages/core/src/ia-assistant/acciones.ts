"use server";

import { revalidatePath } from "next/cache";
import { getDB } from "../db";
import { currentVertical } from "../vertical";
import {
  asistenteDisponible,
  enviarMensaje,
  pedirBorrador,
  type LeadParaAsistente,
  type RespuestaPreview,
} from "./cliente";

/**
 * Acciones del contacto autorizado por WhatsApp.
 *
 * El envío está partido en dos a propósito y la separación es el punto entero
 * de esta pantalla: primero se pide el borrador y se muestra, después una
 * persona lo aprueba —o lo corrige— y solo entonces sale. El asistente envía
 * literalmente el texto que se le devuelve, así que lo que se leyó en pantalla
 * es lo que le llega al prospecto.
 *
 * Ninguna de estas dos acciones se dispara sola. No hay proceso, ni cron, ni
 * disparador de base de datos que contacte a nadie: siempre sale de un clic.
 */

export interface ResultadoAccion<T> {
  ok: boolean;
  error?: string;
  datos?: T;
}

/**
 * Los datos del lead que el asistente necesita, leídos de la base.
 *
 * `SELECT *` y no una lista de columnas. La tabla `quotes` **no tiene la misma
 * forma en las dos marcas**: la de Energy nació antes, con las columnas del
 * formulario solar, y no tiene `company`, `requirement`, `budget` ni
 * `projectType`. Pedirlas por nombre lanzaba `no such column` y dejaba el botón
 * de contacto colgado en "Redactando…" sin decir nada.
 */
async function leerLead(id: number): Promise<LeadParaAsistente | null> {
  const db = await getDB();
  const fila = await db.get(
    `SELECT * FROM quotes WHERE id = ? AND (isDeleted = 0 OR isDeleted IS NULL)`,
    [id],
  );
  if (!fila) return null;

  return {
    crmId: fila.id,
    crmVertical: currentVertical(),
    fullName: fila.fullName,
    phone: fila.phone,
    email: fila.email ?? null,
    company: fila.company ?? null,
    /* Lo que el prospecto necesita. En Systems es un campo propio; en Energy
       hay que armarlo con lo que sí pidió su formulario. No es un relleno: el
       consumo y la ciudad son justo lo que el asistente solar necesita para que
       el primer mensaje hable del caso de la persona y no de generalidades. */
    requirement: fila.requirement ?? contextoSolar(fila),
    message: fila.message ?? null,
    budget: fila.budget ?? null,
    source: fila.source ?? null,
    projectType: fila.projectType ?? fila.modality ?? fila.installType ?? null,
    /* El adjunto se guardaba y ahí se quedaba: el asistente no sabía que
       existía, así que pedía la foto del recibo a quien ya la había subido. */
    reciboAdjunto: Boolean(fila.filePath),
    /* Y la ruta, para que el asistente pueda LEERLA. Antes solo sabía que
       existía, así que dimensionaba con el consumo que la persona había
       escrito de memoria en el formulario en vez de con el histórico de la
       factura que tenía adjunta. */
    reciboUrl: fila.filePath ?? null,
  };
}

/** Resume en una frase lo que el formulario de Energy sí recogió. */
function contextoSolar(fila: Record<string, any>): string | null {
  const partes: string[] = [];
  if (fila.consumption) partes.push(`consume ${fila.consumption} kWh al mes`);
  if (fila.location || fila.address) partes.push(`en ${fila.location ?? fila.address}`);
  if (fila.installType) partes.push(`instalación de tipo ${fila.installType}`);
  if (fila.gridType) partes.push(`red ${fila.gridType}`);
  if (fila.objective) partes.push(`busca ${fila.objective}`);
  return partes.length ? partes.join(", ") : null;
}

export async function prepararWhatsApp(
  leadId: number,
): Promise<ResultadoAccion<RespuestaPreview>> {
  if (!asistenteDisponible()) {
    return { ok: false, error: "Esta línea todavía no tiene asistente de WhatsApp configurado." };
  }

  const lead = await leerLead(leadId);
  if (!lead) return { ok: false, error: "Lead no encontrado." };
  if (!lead.phone?.trim()) {
    return { ok: false, error: "Este lead no dejó número de WhatsApp." };
  }

  try {
    return { ok: true, datos: await pedirBorrador(lead) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falló la preparación." };
  }
}

/**
 * Envía el texto aprobado.
 *
 * No escribe la nota ni mueve la etapa: de eso se encarga el propio asistente
 * avisando a `/api/whatsapp/eventos` una vez el mensaje salió de verdad. Si lo
 * hiciéramos también aquí, un envío fallido dejaría el lead marcado como
 * contactado sin que nadie haya recibido nada.
 */
export async function enviarWhatsApp(
  leadId: number,
  texto: string,
): Promise<ResultadoAccion<{ mensaje?: string; toque?: number }>> {
  if (!asistenteDisponible()) {
    return { ok: false, error: "Esta línea todavía no tiene asistente de WhatsApp configurado." };
  }
  if (!texto?.trim()) {
    return { ok: false, error: "No hay mensaje que enviar." };
  }

  const lead = await leerLead(leadId);
  if (!lead) return { ok: false, error: "Lead no encontrado." };

  try {
    const r = await enviarMensaje(lead, texto);
    if (!r.enviado) {
      return { ok: false, error: r.motivo ?? "El asistente no envió el mensaje." };
    }

    revalidatePath("/admin/leads");
    return { ok: true, datos: { mensaje: r.mensaje, toque: r.toque } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falló el envío." };
  }
}
