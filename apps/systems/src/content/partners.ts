import type { IconType } from "react-icons";
import {
  SiSiemens,
  SiRockwellautomation,
  SiSchneiderelectric,
  SiClaude,
  SiOpenai,
  SiNvidia,
} from "react-icons/si";

/**
 * Banda de logos del home: empresas con las que colaboramos y compañías cuyos
 * productos o servicios usamos. Sin texto — solo marcas.
 *
 * Dos orígenes posibles por entrada:
 *  - `icon`:  marca disponible en react-icons (se pinta monocromática, hereda color).
 *  - `logo`:  archivo propio en `public/logos/`. Si el archivo aún no existe,
 *             la entrada se oculta sola en el carrusel (ver PartnersMarquee).
 *
 * `name` nunca se muestra: es solo `alt` y ayuda de accesibilidad.
 */
export interface Partner {
  name: string;
  icon?: IconType;
  logo?: string;
  /**
   * `true` cuando el icono ya incluye el nombre de la marca (es un logotipo
   * completo, no un isotipo). En ese caso no se repite el nombre debajo.
   */
  isWordmark?: boolean;
}

export const PARTNERS: Partner[] = [
  { name: "Ecopetrol", logo: "/logos/ecopetrol.svg" },
  { name: "Cabot", logo: "/logos/cabot.svg" },
  { name: "Cámara de Comercio de Cartagena", logo: "/logos/camara-comercio-cartagena.svg" },
  { name: "IXL Center", logo: "/logos/ixl-center.svg" },
  { name: "Econova", logo: "/logos/econova.svg" },
  { name: "Siemens", icon: SiSiemens, isWordmark: true },
  { name: "Rockwell Automation", icon: SiRockwellautomation },
  { name: "Schneider Electric", icon: SiSchneiderelectric },
  { name: "Claude", icon: SiClaude },
  { name: "OpenAI", icon: SiOpenai },
  { name: "NVIDIA", icon: SiNvidia },
];
