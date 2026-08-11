"use server";

import { headers } from "next/headers";
import { confirmarAccionSensible } from "../confirmar";
import {
  asistenteDisponible,
  canjearCodigoGoogle,
  limpiarConversacion,
  revincularLinea,
  traerAgenda,
  traerMetricas,
  traerModelos,
  traerGoogle,
  traerVinculacion,
  type Agenda,
  type EstadoGoogle,
  type Metricas,
  type ModeloDisponible,
  type Vinculacion,
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
): Promise<Resultado<{ turnos: number; eventosAnonimizados: number; leadReiniciado?: string }>> {
  const confirmacion = await confirmarAccionSensible(
    pass,
    "conversacion_whatsapp_borrada",
    `${quien || conversationId}`,
  );
  if (!confirmacion.ok) return { ok: false, error: confirmacion.error };

  return intentar(() => limpiarConversacion(conversationId));
}

/* --------------------------------------------------------- vincular la línea */

/**
 * Estado del pareo de WhatsApp, con el QR cuando toca escanear.
 *
 * No pide contraseña: solo lee. Y de todas formas esta pantalla es de
 * `/admin/ia-assistant/configuracion`, que ya es exclusiva del propietario.
 */
export async function cargarVinculacion(): Promise<Resultado<Vinculacion>> {
  return intentar(() => traerVinculacion());
}

/**
 * Desvincula la línea de WhatsApp y arranca un pareo nuevo.
 *
 * Es la operación más destructiva que se puede hacer desde el panel, por encima
 * de borrar una conversación: mientras nadie escanee el QR nuevo, el asistente
 * queda **completamente mudo**. No recibe mensajes de clientes ni puede
 * contestar los que ya llegaron. Una conversación borrada afecta a un
 * prospecto; esto los afecta a todos a la vez.
 *
 * Por eso pide contraseña, con el mismo mecanismo que borrar un lead: se
 * comprueba contra la cuenta de quien está actuando y queda registrado en la
 * auditoría quién lo autorizó y cuándo.
 *
 * Lo que NO se pierde: el historial de conversaciones, los prospectos y la
 * contabilidad de tokens viven en otro sitio y sobreviven al cambio de línea.
 */
export async function revincularLineaConfirmada(
  pass: string,
  motivo: string,
): Promise<Resultado<{ ok: true; archivadoEn?: string }>> {
  const confirmacion = await confirmarAccionSensible(
    pass,
    "whatsapp_linea_desvinculada",
    motivo || "sin motivo indicado",
  );
  if (!confirmacion.ok) return { ok: false, error: confirmacion.error };

  return intentar(() => revincularLinea());
}

/* ------------------------------------------------------------ Google Workspace */

/**
 * Dónde vuelve Google después de autorizar.
 *
 * Tiene que ser una dirección **pública**: el asistente escucha solo en
 * loopback, así que su propia URL de retorno —`localhost:3021`— no la alcanza
 * el navegador de nadie. La primera vez que se conectó Google hubo que abrir un
 * túnel SSH para completar el paso. Pasando por el panel, que sí está publicado,
 * deja de hacer falta.
 *
 * Se deduce de la petición en curso y no de una variable de entorno, para que
 * funcione igual en el servidor y en desarrollo sin configurar nada. Detrás de
 * Nginx hay que mirar `x-forwarded-*`, o saldría `http` y el puerto interno.
 */
async function urlDeRetorno(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/admin/ia-assistant/google`;
}

export async function cargarGoogle(): Promise<Resultado<EstadoGoogle>> {
  const retorno = await urlDeRetorno();
  return intentar(() => traerGoogle(retorno));
}

/**
 * Entrega al asistente el código que Google devolvió.
 *
 * La URL de retorno se recalcula igual que al pedir el consentimiento: Google
 * compara las dos y rechaza el canje si difieren en un solo carácter.
 */
export async function conectarGoogle(code: string): Promise<Resultado<{ cuenta?: string }>> {
  const retorno = await urlDeRetorno();
  return intentar(() => canjearCodigoGoogle(code, retorno));
}
