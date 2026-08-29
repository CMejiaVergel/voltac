import type { MetadataRoute } from "next";
import { VERTICAL_CONFIG } from "../vertical";
import type { Marca } from "../roles";

/**
 * El manifiesto que hace instalable el panel.
 *
 * Se sirve desde `/admin/manifest.webmanifest` y no desde la raiz a proposito:
 * lo que se instala es el PANEL, no el sitio publico. Con un manifiesto en la
 * raiz, a un visitante que entra a leer el blog le ofreceria instalar una
 * herramienta interna que ni siquiera puede abrir.
 *
 * `scope` acotado a `/admin` cierra el circulo: si desde la aplicacion
 * instalada se toca un enlace al sitio publico, se abre en el navegador en vez
 * de dentro de la app.
 */
export function manifiestoPanel(marca: Extract<Marca, "systems" | "energy">): MetadataRoute.Manifest {
  const cfg = VERTICAL_CONFIG[marca];

  /* El color de fondo es el oscuro de la marca y coincide con el de los
     iconos. Es el que pinta la pantalla mientras la aplicacion arranca: con el
     blanco por defecto se ve un destello claro en cada apertura. */
  const oscuro = marca === "energy" ? "#0d1f14" : "#0a0f1e";

  return {
    id: `voltac-${marca}-admin`,
    name: `${cfg.name} · Panel`,
    short_name: "Panel",
    description: `Panel de administración de ${cfg.name}`,
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: oscuro,
    theme_color: oscuro,
    lang: "es-CO",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /* Android recorta el icono a la forma del lanzador y solo garantiza el
         80% central. Sin una version `maskable`, el logo pierde los bordes. */
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
