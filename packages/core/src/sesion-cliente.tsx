"use client";

import * as React from "react";
import type { Rol } from "./roles";

/**
 * La sesión, disponible para los componentes de cliente del panel.
 *
 * El valor lo inyecta el layout del panel, que es un componente de servidor y
 * lee la cookie firmada. El cliente solo lo consume.
 *
 * Sustituye a `localStorage.getItem("voltac_admin_role")`, que era el mismo
 * error que ya habíamos sacado del login: un dato que decide qué se muestra,
 * guardado donde el propio navegador puede reescribirlo. Mientras solo entrara
 * el propietario no importaba; con contadores y moderadores en el panel, sí.
 *
 * Aun así, esto es solo para pintar. Quien decide de verdad es el proxy y las
 * rutas de API en el servidor: ocultar un enlace nunca ha impedido escribir la
 * dirección a mano.
 */

export interface SesionCliente {
  usuario: string;
  rol: Rol;
}

const Contexto = React.createContext<SesionCliente | null>(null);

export function SesionProvider({
  valor,
  children,
}: {
  valor: SesionCliente | null;
  children: React.ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Sesión actual, o `null` en las pantallas que no la tienen (el login). */
export function useSesion(): SesionCliente | null {
  return React.useContext(Contexto);
}
