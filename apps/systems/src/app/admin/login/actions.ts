"use server";

/* Puente al nucleo: la implementacion vive en @voltac/core/sesion y la
   comparten las dos lineas de negocio. Next registra las acciones de servidor
   por aplicacion, asi que la declaracion tiene que estar aqui. No editar la
   logica en este archivo. */

import { iniciarSesion, cerrarSesion } from "@voltac/core/sesion";

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  return iniciarSesion(formData);
}

export async function logout(): Promise<void> {
  return cerrarSesion();
}
