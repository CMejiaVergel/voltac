/**
 * Roles del panel.
 *
 * Nacen de quién trabaja realmente sobre la plataforma, no de una jerarquía
 * abstracta de permisos:
 *
 *  - `propietario`  quien dirige la empresa. Ve todo, en las dos marcas.
 *  - `contador`     el equipo contable. Necesita la facturación completa y el
 *                   calendario tributario; no le compete la captación ni el CRM.
 *  - `moderador`    quien produce contenido y campañas. Necesita métricas y
 *                   calendario; no le compete la información financiera ni los
 *                   datos personales de los prospectos.
 *
 * Deliberadamente son tres y no un sistema de permisos por casilla. Un panel de
 * esta escala con permisos granulares se convierte en una pantalla de
 * configuración que nadie mantiene y que acaba concediendo de más por comodidad.
 * Tres roles se entienden de un vistazo y se auditan leyendo esta lista.
 *
 * Este archivo no importa nada: lo usan tanto el proxy (runtime Edge) como la
 * interfaz y las rutas de API.
 */

export const ROLES = ["propietario", "contador", "moderador"] as const;

export type Rol = (typeof ROLES)[number];

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

/** Nombre legible, para la interfaz y los mensajes. */
export const ROL_ETIQUETA: Record<Rol, string> = {
  propietario: "Propietario",
  contador: "Contabilidad",
  moderador: "Contenido y campañas",
};

export const ROL_DESCRIPCION: Record<Rol, string> = {
  propietario: "Acceso completo a las dos líneas de negocio.",
  contador: "Contabilidad, calendario tributario y documentación de la empresa.",
  moderador: "Métricas, calendario de contenido, proyectos y noticias.",
};
