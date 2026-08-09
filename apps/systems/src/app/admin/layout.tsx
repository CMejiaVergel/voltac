import * as React from "react";
import { sesionActual } from "@voltac/core/sesion";
import { SesionProvider } from "@voltac/core/sesion-cliente";
import AdminShell from "./AdminShell";

/**
 * El layout del panel pasa a ser de servidor.
 *
 * Es el unico sitio donde se puede leer la cookie firmada una sola vez y
 * repartir la identidad a todo lo que hay debajo. La interfaz vive en
 * `AdminShell`, que sigue siendo de cliente porque necesita estado propio
 * —menu plegado, menu movil—.
 *
 * En `/admin/login` no hay sesion todavia y el valor viaja como `null`; el
 * shell reconoce esa ruta y se aparta.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();

  return (
    <SesionProvider valor={sesion ? { usuario: sesion.sub, rol: sesion.rol } : null}>
      <AdminShell>{children}</AdminShell>
    </SesionProvider>
  );
}
