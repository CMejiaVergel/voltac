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

/** Los datos del lead que el asistente necesita, leídos de la base. */
async function leerLead(id: number): Promise<LeadParaAsistente | null> {
  const db = await getDB();
  const fila = await db.get(
    `SELECT id, fullName, phone, email, company, requirement, message, budget, source, projectType
       FROM quotes
      WHERE id = ? AND (isDeleted = 0 OR isDeleted IS NULL)`,
    [id],
  );
  if (!fila) return null;

  return {
    crmId: fila.id,
    crmVertical: currentVertical(),
    fullName: fila.fullName,
    phone: fila.phone,
    email: fila.email,
    company: fila.company,
    requirement: fila.requirement,
    message: fila.message,
    budget: fila.budget,
    source: fila.source,
    projectType: fila.projectType,
  };
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
