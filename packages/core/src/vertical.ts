/**
 * Líneas de negocio de Voltac Systems S.A.S.
 *
 * La compañía es una sola y está constituida una sola vez; lo que hay son dos
 * frentes comerciales con marca propia. Esa distinción manda en todo el
 * sistema:
 *
 *  - La **contabilidad es de la empresa**, no de la línea. Los contadores
 *    necesitan ver facturación y movimientos de forma global, así que las
 *    tablas `acc_*` no se filtran por vertical.
 *  - El **contenido y los prospectos son de la línea**. Un lead de energía
 *    solar no tiene por qué aparecer en el panel de inteligencia artificial,
 *    ni una noticia de una marca publicarse en el sitio de la otra.
 *
 * De ahí que el filtro por vertical se aplique en la capa de acceso a datos y
 * no en la interfaz: un descuido al pintar una tabla no puede mezclar marcas.
 */

export const VERTICALS = ["systems", "energy"] as const;
export type Vertical = (typeof VERTICALS)[number];

export interface VerticalConfig {
  id: Vertical;
  /** Nombre comercial de la línea */
  name: string;
  /** Razón social — la misma para ambas: es una sola empresa */
  legalName: string;
  nit: string;
  domain: string;
  /** Etiqueta corta para el panel cuando conviven ambas líneas */
  label: string;
}

export const VERTICAL_CONFIG: Record<Vertical, VerticalConfig> = {
  systems: {
    id: "systems",
    name: "Voltac Systems",
    legalName: "Voltac Systems S.A.S.",
    nit: "901.734.603",
    domain: "https://voltac.com.co",
    label: "Tecnología e IA",
  },
  energy: {
    id: "energy",
    name: "Voltac Energy",
    legalName: "Voltac Systems S.A.S.",
    nit: "901.734.603",
    domain: "https://energy.voltac.com.co",
    label: "Energía renovable",
  },
};

/**
 * Vertical de la aplicación que está corriendo.
 *
 * Cada app declara la suya en su entorno (`VOLTAC_VERTICAL`). Se resuelve una
 * sola vez y falla ruidosamente si el valor no es válido: arrancar con una
 * vertical equivocada significaría mostrar los datos de la otra marca, y eso
 * debe romperse en el arranque, no descubrirse en producción.
 */
export function currentVertical(): Vertical {
  const raw = process.env.VOLTAC_VERTICAL;
  if (!raw) {
    throw new Error(
      "Falta VOLTAC_VERTICAL en el entorno. Valores válidos: " + VERTICALS.join(", "),
    );
  }
  if (!VERTICALS.includes(raw as Vertical)) {
    throw new Error(
      `VOLTAC_VERTICAL="${raw}" no es válido. Valores permitidos: ${VERTICALS.join(", ")}`,
    );
  }
  return raw as Vertical;
}

export function verticalConfig(): VerticalConfig {
  return VERTICAL_CONFIG[currentVertical()];
}
