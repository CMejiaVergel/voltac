import * as React from "react";
import type { Metadata, Viewport } from "next";
import { sesionActual } from "@voltac/core/sesion";
import { SesionProvider } from "@voltac/core/sesion-cliente";
import { AdminShell, InstalarApp, RegistrarServiceWorker } from "@voltac/core/admin-shell";
import { logout } from "./login/actions";

/**
 * El layout del panel es de servidor.
 *
 * Es el unico sitio donde se puede leer la cookie firmada una sola vez y
 * repartir la identidad a todo lo que hay debajo. La interfaz vive en
 * `AdminShell`, que es de cliente porque necesita estado propio --barra
 * plegada, hoja de secciones-- y que ahora es compartido: estaba duplicado en
 * las dos aplicaciones y la unica diferencia real era el logo.
 *
 * `logout` viaja como propiedad y no se importa dentro del componente: la
 * sesion es una cookie httpOnly y solo el servidor puede borrarla.
 *
 * En `/admin/login` no hay sesion todavia y el valor viaja como `null`; el
 * shell reconoce esa ruta y se aparta.
 */

/**
 * El manifiesto se declara AQUI y no en la raiz a proposito: lo que se instala
 * es el panel, no el sitio publico. Anunciarlo en la raiz le ofreceria a quien
 * entra a leer el blog instalar una herramienta interna que no puede abrir.
 */
export const metadata: Metadata = {
  manifest: "/panel.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Panel",
    // `black-translucent` deja que el contenido suba bajo la barra de estado.
    // Es lo que hace que no se vea una franja blanca arriba en iOS.
    statusBarStyle: "black-translucent",
  },
  robots: { index: false, follow: false },
};

/**
 * `viewportFit: "cover"` es la linea que sostiene todo el diseno movil.
 *
 * Sin ella el navegador reserva las franjas del notch y del indicador de
 * inicio, `env(safe-area-inset-*)` vale cero, y todos los margenes seguros que
 * calcula el shell no hacen nada. Con ella el contenido llega de borde a borde
 * y es la aplicacion la que decide donde apartarse.
 *
 * `maximumScale` NO se limita: bloquear el zoom deja sin salida a quien
 * necesita ampliar para leer. El zoom involuntario al enfocar un campo se
 * resuelve en CSS con la letra a 16px, que arregla el problema sin quitarle
 * nada a nadie.
 */
export const viewport: Viewport = {
  themeColor: "#0d1f14",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();

  return (
    <SesionProvider valor={sesion ? { usuario: sesion.sub, rol: sesion.rol } : null}>
      <RegistrarServiceWorker />
      <InstalarApp />
      <AdminShell
        marca="energy"
        logos={{ horizontal: "/logo_horizontal_fondo_oscuro.png", isotipo: "/isotipo_fondo_oscuro.png" }}
        logout={logout}
      >
        {children}
      </AdminShell>
    </SesionProvider>
  );
}
