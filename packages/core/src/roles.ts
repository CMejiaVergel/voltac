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
 * Este archivo no importa nada: lo usan por igual el proxy, la interfaz y las
 * rutas de API.
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

/**
 * Dónde aterriza cada rol al entrar. El login siempre manda a `/admin`.
 *
 * El moderador cae en el calendario y no en las métricas: lo primero que
 * necesita al abrir el panel es qué le toca hoy, no cuánta gente visitó el
 * sitio la semana pasada.
 */
export const INICIO: Record<Rol, string> = {
  propietario: "/admin",
  contador: "/admin/accounting",
  moderador: "/admin/contenido",
};

export interface ReglaAcceso {
  prefijo: string;
  roles: readonly Rol[];
}

/**
 * Quién alcanza qué. Es la lista completa: si una ruta no aparece aquí ni bajo
 * un prefijo de aquí, es pública.
 *
 * Gana el prefijo **más largo** que coincida, no el primero. Sin esa regla,
 * `/admin` —que es solo del propietario— taparía a `/admin/accounting`, y el
 * contador no podría entrar a lo único que le corresponde.
 *
 * Fuera de la lista, deliberadamente:
 *
 *  - `/api/uploads` sirve las imágenes de proyectos y noticias que se muestran
 *    en las páginas públicas. Su protección es otra —contención de ruta y lista
 *    blanca de extensiones dentro del endpoint—, no el control de acceso.
 *  - `/api/leads` se autentica con token Bearer para la ingesta externa de
 *    prospectos: es código llamando a código, no una persona con sesión. Es la
 *    base de la ingesta multicanal.
 *  - `/api/whatsapp/eventos` lo llama el asistente de WhatsApp para contar qué
 *    pasó en cada conversación. Se autentica con la misma tabla `api_keys` que
 *    la ingesta: llega cuando el prospecto escribe, que puede ser de madrugada
 *    y sin nadie con sesión abierta.
 *  - `/api/analytics` recibe eventos del sitio público; valida el tipo de
 *    evento y no expone lectura.
 *  - `/api/quote` es el formulario público de cotización.
 *
 * Las acciones de servidor no necesitan entrada propia: viajan como POST a la
 * dirección de la página que las usa, así que quedan cubiertas por la regla de
 * esa página.
 */
export const ACCESO: readonly ReglaAcceso[] = [
  { prefijo: "/admin", roles: ["propietario"] },
  { prefijo: "/admin/proyectos", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/news", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/analytics", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/contenido", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/preview", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/accounting", roles: ["propietario", "contador"] },
  { prefijo: "/admin/accounting/configuracion", roles: ["propietario"] },
  /* Solo el propietario. Aquí se leen conversaciones enteras con prospectos y
     se puede escribir en nombre de la empresa: es más de lo que le compete al
     moderador, que por la misma razón tampoco entra al CRM. */
  { prefijo: "/admin/ia-assistant", roles: ["propietario"] },

  { prefijo: "/api/accounting", roles: ["propietario", "contador"] },
  { prefijo: "/api/usuarios", roles: ["propietario"] },
  { prefijo: "/api/contenido", roles: ["propietario", "moderador"] },
  // Subida de imagenes del blog. No tenia ninguna comprobacion: cualquiera
  // podia escribir archivos en el disco del servidor sin credenciales.
  { prefijo: "/api/upload-news-image", roles: ["propietario", "moderador"] },
];

function alcanza(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

/** Roles admitidos en una ruta, o `null` si la ruta es pública. */
export function rolesPara(pathname: string): readonly Rol[] | null {
  let mejor: ReglaAcceso | null = null;
  for (const regla of ACCESO) {
    if (!alcanza(pathname, regla.prefijo)) continue;
    if (!mejor || regla.prefijo.length > mejor.prefijo.length) mejor = regla;
  }
  return mejor ? mejor.roles : null;
}

export function puedeAcceder(rol: Rol, pathname: string): boolean {
  const permitidos = rolesPara(pathname);
  return permitidos === null || permitidos.includes(rol);
}
