/**
 * Formas del calendario editorial.
 *
 * Sin directiva, para que lo puedan importar por igual el servidor y los
 * componentes de cliente.
 */

export const MARCAS = ["systems", "energy", "ambas"] as const;
export type Marca = (typeof MARCAS)[number];

export const MARCA_ETIQUETA: Record<Marca, string> = {
  systems: "Voltac",
  energy: "Voltac Energy",
  ambas: "Las dos",
};

/**
 * Tipos de actividad.
 *
 * Nacen del trabajo real de quien produce el contenido, no de una taxonomía
 * abstracta: grabar es un bloque de agenda con equipo y desplazamiento;
 * publicar es un instante; una campaña dura días.
 */
export const TIPOS = ["grabacion", "edicion", "publicacion", "reunion", "campana", "recordatorio"] as const;
export type Tipo = (typeof TIPOS)[number];

export const TIPO_ETIQUETA: Record<Tipo, string> = {
  grabacion: "Grabación",
  edicion: "Edición",
  publicacion: "Publicación",
  reunion: "Reunión",
  campana: "Campaña",
  recordatorio: "Recordatorio",
};

export const ESTADOS = ["planificada", "en_proceso", "hecha", "cancelada"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_ETIQUETA: Record<Estado, string> = {
  planificada: "Planificada",
  en_proceso: "En proceso",
  hecha: "Hecha",
  cancelada: "Cancelada",
};

export interface Actividad {
  id: number;
  marca: Marca;
  titulo: string;
  tipo: Tipo;
  /** Hora local de Colombia, `YYYY-MM-DDTHH:MM`. Ver la nota en `db.ts`. */
  inicia_en: string;
  duracion_min: number;
  todo_el_dia: boolean;
  estado: Estado;
  responsable: string | null;
  notas: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

export type ActividadNueva = Pick<
  Actividad,
  "marca" | "titulo" | "tipo" | "inicia_en" | "duracion_min" | "todo_el_dia" | "estado"
> & {
  responsable?: string | null;
  notas?: string | null;
};

export function esMarca(v: unknown): v is Marca {
  return typeof v === "string" && (MARCAS as readonly string[]).includes(v);
}
export function esTipo(v: unknown): v is Tipo {
  return typeof v === "string" && (TIPOS as readonly string[]).includes(v);
}
export function esEstado(v: unknown): v is Estado {
  return typeof v === "string" && (ESTADOS as readonly string[]).includes(v);
}
