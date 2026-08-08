"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  adminConfig,
  safeEqual,
  sha256Hex,
  signSession,
} from "@/lib/auth";

/**
 * Validación de credenciales en el servidor.
 *
 * La versión anterior comparaba usuario y contraseña dentro del componente de
 * React, así que las credenciales viajaban en el bundle público. Aquí nunca
 * salen del servidor: solo se compara el hash contra el del entorno.
 */

/** Retardo fijo para que un intento fallido no sea más rápido que uno válido. */
const FAILURE_DELAY_MS = 600;

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

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const providedHash = await sha256Hex(password);
  const ok =
    safeEqual(username, config.username) && safeEqual(providedHash, config.passwordHash);

  if (!ok) {
    await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
    return { error: "Credenciales incorrectas." };
  }

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
