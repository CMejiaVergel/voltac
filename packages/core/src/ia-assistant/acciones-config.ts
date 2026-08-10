"use server";

import {
  asistenteDisponible,
  escribirAjustes,
  restaurarAjustes,
  traerAjustes,
  verPrompt,
  type Ajustes,
  type AjustesCompletos,
} from "./cliente";

/** Puente delgado hacia el asistente. La validación de rangos vive allá. */

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

export async function cargarConfiguracion(): Promise<Resultado<AjustesCompletos>> {
  return intentar(() => traerAjustes());
}

export async function guardarConfiguracion(
  patch: Partial<Ajustes>,
): Promise<Resultado<{ ajustes: Ajustes }>> {
  return intentar(() => escribirAjustes(patch));
}

export async function volverAValoresDeOrigen(): Promise<Resultado<{ ajustes: Ajustes }>> {
  return intentar(() => restaurarAjustes());
}

export async function cargarPrompt(): Promise<
  Resultado<{ prompt: string; herramientas: string[]; caracteres: number }>
> {
  return intentar(() => verPrompt());
}
