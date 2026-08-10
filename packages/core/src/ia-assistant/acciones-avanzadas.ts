"use server";

import { confirmarAccionSensible } from "../confirmar";
import {
  asistenteDisponible,
  limpiarConversacion,
  traerAgenda,
  traerMetricas,
  traerModelos,
  type Agenda,
  type Metricas,
  type ModeloDisponible,
} from "./cliente";

export interface Resultado<T> {
  ok: boolean;
  error?: string;
  datos?: T;
}

async function intentar<T>(fn: () => Promise<T>): Promise<Resultado<T>> {
  if (!asistenteDisponible()) {
    return { ok: false, error: "Esta línea todavía no tiene asistente de WhatsApp configurado." };
  }
  try {
    return { ok: true, datos: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falló la operación." };
  }
}

export async function cargarAgenda(dias = 14): Promise<Resultado<Agenda>> {
  return intentar(() => traerAgenda(dias));
}

export async function cargarMetricas(dias = 30): Promise<Resultado<Metricas>> {
  return intentar(() => traerMetricas(dias));
}

export async function cargarModelos(): Promise<Resultado<ModeloDisponible[]>> {
  const r = await intentar(() => traerModelos());
  return r.ok ? { ok: true, datos: r.datos!.modelos } : { ok: false, error: r.error };
}

/**
 * Borra una conversación entera: mensajes, ficha y rastro en la auditoría.
 *
 * Pide la contraseña por la misma razón que borrar un lead: no es una barrera
 * contra quien ya entró —eso no lo arregla una contraseña más—, es contra el
 * descuido. Un clic equivocado aquí borra la conversación de un cliente real y
 * no hay forma de recuperarla.
 *
 * La comprobación se hace **aquí y no en el asistente**: este lado sabe quién
 * tiene la sesión abierta, así que puede validar contra su cuenta y dejar en la
 * auditoría quién lo autorizó. El asistente no conoce a los usuarios del panel.
 */
export async function limpiarConversacionConfirmada(
  conversationId: string,
  pass: string,
  quien: string,
): Promise<Resultado<{ turnos: number; eventos: number; leadReiniciado?: string }>> {
  const confirmacion = await confirmarAccionSensible(
    pass,
    "conversacion_whatsapp_borrada",
    `${quien || conversationId}`,
  );
  if (!confirmacion.ok) return { ok: false, error: confirmacion.error };

  return intentar(() => limpiarConversacion(conversationId));
}
