"use server";

import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  adminConfig,
  safeEqual,
  sha256Hex,
  signSession,
} from "@voltac/core/auth";

/**
 * Validación de credenciales en el servidor.
 *
 * La versión anterior comparaba usuario y contraseña dentro del componente de
 * React, así que las credenciales viajaban en el bundle público. Aquí nunca
 * salen del servidor: solo se compara el hash contra el del entorno.
 */

/** Retardo fijo para que un intento fallido no sea más rápido que uno válido. */
const FAILURE_DELAY_MS = 600;

/**
 * Freno de fuerza bruta.
 *
 * fail2ban protege el SSH, pero el login web no tenía ningún límite: se podían
 * probar contraseñas a la velocidad que aguantara el servidor. Cinco intentos
 * fallidos bloquean esa IP durante quince minutos.
 *
 * El registro vive en memoria a propósito: es una dependencia menos y se
 * reinicia con cada despliegue, lo cual es aceptable porque Nginx aplica un
 * segundo límite por delante. Para un panel de un solo usuario, una tabla en
 * base de datos sería más maquinaria de la que el problema justifica.
 */
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60_000;
const intentos = new Map<string, { fallos: number; desde: number }>();

function clienteId(headerList: Headers): string {
  // Nginx envía X-Forwarded-For; el primer valor es el cliente real.
  const fwd = headerList.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : headerList.get("x-real-ip")) ?? "desconocido";
}

function bloqueado(id: string): number {
  const registro = intentos.get(id);
  if (!registro) return 0;
  const transcurrido = Date.now() - registro.desde;
  if (transcurrido > VENTANA_MS) {
    intentos.delete(id);
    return 0;
  }
  if (registro.fallos < MAX_INTENTOS) return 0;
  return Math.ceil((VENTANA_MS - transcurrido) / 60_000);
}

function registrarFallo(id: string): void {
  const registro = intentos.get(id);
  if (!registro || Date.now() - registro.desde > VENTANA_MS) {
    intentos.set(id, { fallos: 1, desde: Date.now() });
    return;
  }
  registro.fallos += 1;
}

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const config = adminConfig();

  if (!config) {
    return {
      error:
        "El acceso administrativo no está configurado en este servidor. Defina ADMIN_SESSION_SECRET, ADMIN_USERNAME y ADMIN_PASSWORD_HASH.",
    };
  }

  const id = clienteId(await headers());
  const minutosRestantes = bloqueado(id);
  if (minutosRestantes > 0) {
    return {
      error: `Demasiados intentos fallidos. Vuelva a intentarlo en ${minutosRestantes} minuto${
        minutosRestantes === 1 ? "" : "s"
      }.`,
    };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const providedHash = await sha256Hex(password);
  const ok =
    safeEqual(username, config.username) && safeEqual(providedHash, config.passwordHash);

  if (!ok) {
    registrarFallo(id);
    await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
    return { error: "Credenciales incorrectas." };
  }

  // Un acierto limpia el historial: quien ya demostró conocer la clave no
  // debería quedar bloqueado por haberse equivocado antes.
  intentos.delete(id);

  const token = await signSession(username, config.secret);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return {};
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
