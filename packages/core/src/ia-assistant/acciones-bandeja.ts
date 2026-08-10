"use server";

import {
  asistenteDisponible,
  devolverAlBot,
  listarConversaciones,
  novedades,
  responderConversacion,
  verConversacion,
  type ConversacionDetalle,
  type ConversacionResumen,
  type Novedades,
} from "./cliente";

/**
 * Acciones de la bandeja.
 *
 * Son un puente delgado sobre el cliente HTTP y nada más: no hay lógica de
 * negocio aquí. Existen porque el navegador no puede hablar directamente con el
 * asistente —vive en loopback y no está expuesto—, así que la petición tiene
 * que salir del servidor de Next.
 *
 * Ese rodeo es una ventaja, no un costo: el token del asistente nunca llega al
 * navegador, y el control de acceso del panel decide quién puede llamar antes
 * de que la petición exista.
 */

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

export async function traerConversaciones(): Promise<Resultado<ConversacionResumen[]>> {
  const r = await intentar(() => listarConversaciones());
  return r.ok ? { ok: true, datos: r.datos!.conversaciones } : { ok: false, error: r.error };
}

export async function traerConversacion(id: string): Promise<Resultado<ConversacionDetalle>> {
  return intentar(() => verConversacion(id));
}

export async function responder(id: string, texto: string): Promise<Resultado<{ ok: boolean }>> {
  if (!texto?.trim()) return { ok: false, error: "No hay mensaje que enviar." };
  return intentar(() => responderConversacion(id, texto));
}

export async function reactivarAsistente(id: string): Promise<Resultado<{ ok: boolean }>> {
  return intentar(() => devolverAlBot(id));
}

export async function consultarNovedades(desde: number): Promise<Resultado<Novedades>> {
  return intentar(() => novedades(desde));
}
