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
 *  - `asesor`       quien atiende prospectos. Necesita el CRM y el asistente
 *                   —conversaciones, calendario, panel—; no le compete la
 *                   contabilidad, ni el contenido, ni crear usuarios, ni
 *                   cambiar cómo se comporta el asistente.
 *  - `operador`     quien lleva la operación de una línea de negocio. Es un
 *                   asesor con el tablero general y el dimensionamiento: ve
 *                   cómo va el negocio, no solo la conversación que tiene
 *                   delante. No le compete la contabilidad, ni el contenido,
 *                   ni crear usuarios, ni cambiar el comportamiento del
 *                   asistente. Va siempre acompañado de una marca: un operador
 *                   de Energy no entra al panel de Systems.
 *
 * Deliberadamente son cinco y no un sistema de permisos por casilla. Un panel
 * de esta escala con permisos granulares se convierte en una pantalla de
 * configuración que nadie mantiene y que acaba concediendo de más por comodidad.
 * Cuatro roles se entienden de un vistazo y se auditan leyendo esta lista.
 *
 * Este archivo no importa nada: lo usan por igual el proxy, la interfaz y las
 * rutas de API.
 */

export const ROLES = ["propietario", "contador", "moderador", "asesor", "operador"] as const;

export type Rol = (typeof ROLES)[number];

/**
 * A qué marca pertenece una cuenta.
 *
 * Los roles dicen QUÉ puede hacer alguien; esto dice DÓNDE. Hacían falta las
 * dos cosas en cuanto apareció el primer puesto que es de una línea de negocio
 * y no de la empresa entera.
 *
 * La tabla de usuarios es una sola y las dos aplicaciones la comparten, así que
 * sin este campo una cuenta creada para Energy entraría igual al panel de
 * Systems y vería su embudo comercial completo. Quien lleva prospectos solares
 * no tiene por qué ver los del negocio de software.
 *
 * `ambas` es el valor por defecto y es lo que tienen todas las cuentas
 * anteriores: nadie pierde acceso por este cambio.
 */
export const MARCAS = ["ambas", "systems", "energy"] as const;
export type Marca = (typeof MARCAS)[number];

export function esMarca(valor: unknown): valor is Marca {
  return typeof valor === "string" && (MARCAS as readonly string[]).includes(valor);
}

export const MARCA_ETIQUETA: Record<Marca, string> = {
  ambas: "Las dos marcas",
  systems: "Voltac Systems",
  energy: "Voltac Energy",
};

/** Si una cuenta puede entrar al panel de esta línea de negocio. */
export function alcanzaMarca(marca: Marca, vertical: string): boolean {
  return marca === "ambas" || marca === vertical;
}

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

/** Nombre legible, para la interfaz y los mensajes. */
export const ROL_ETIQUETA: Record<Rol, string> = {
  propietario: "Propietario",
  contador: "Contabilidad",
  moderador: "Contenido y campañas",
  asesor: "Asesor de ventas",
  operador: "Operador",
};

export const ROL_DESCRIPCION: Record<Rol, string> = {
  propietario: "Acceso completo a las dos líneas de negocio.",
  contador: "Contabilidad, calendario tributario y documentación de la empresa.",
  moderador: "Métricas, calendario de contenido, proyectos y noticias.",
  asesor:
    "Prospectos y asistente de WhatsApp: atiende conversaciones y agenda reuniones a su nombre.",
  operador:
    "Operación de una línea de negocio: tablero, prospectos, dimensionamiento y asistente de WhatsApp.",
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
  /* El asesor aterriza en el asistente y no en el CRM: lo primero que necesita
     al abrir el panel es si alguien está esperando respuesta, no la lista
     completa de prospectos. */
  asesor: "/admin/ia-assistant",
  /* El operador sí tiene tablero, y es lo primero que necesita al entrar:
     cómo va el negocio, no qué dijo el último cliente. */
  operador: "/admin",
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
 *  - `/api/dimensionamiento` lo llama el asistente de WhatsApp de Energy para
 *    calcular un sistema solar sin hacer la cuenta él mismo. Misma tabla
 *    `api_keys`, y por el mismo motivo: llega cuando un prospecto pregunta un
 *    precio, que puede ser a cualquier hora.
 *  - `/api/analytics` recibe eventos del sitio público; valida el tipo de
 *    evento y no expone lectura.
 *  - `/api/quote` es el formulario público de cotización.
 *
 * Las acciones de servidor no necesitan entrada propia: viajan como POST a la
 * dirección de la página que las usa, así que quedan cubiertas por la regla de
 * esa página.
 */
export const ACCESO: readonly ReglaAcceso[] = [
  /* El tablero general. Al ser el prefijo mas corto, tambien es la regla que
     recoge todo lo que cuelgue de /admin y no este listado abajo: por eso
     agregar un rol AQUI le concede de mas si algo se olvida. Cuando entro el
     operador hubo que declarar de forma explicita /admin/usuarios y
     /admin/configuracion, que hasta entonces se protegian solos por caer en
     esta linea. */
  { prefijo: "/admin", roles: ["propietario", "operador"] },
  /* Crear cuentas y cambiar credenciales de la empresa es del dueno y de nadie
     mas. Antes no hacia falta escribirlo. */
  { prefijo: "/admin/usuarios", roles: ["propietario"] },
  { prefijo: "/admin/configuracion", roles: ["propietario"] },
  { prefijo: "/admin/proyectos", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/news", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/analytics", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/contenido", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/preview", roles: ["propietario", "moderador"] },
  { prefijo: "/admin/accounting", roles: ["propietario", "contador"] },
  { prefijo: "/admin/accounting/configuracion", roles: ["propietario"] },
  /* Propietario y asesor. Aquí se leen conversaciones enteras con prospectos y
     se escribe en nombre de la empresa: es el trabajo del asesor, y es más de lo
     que le compete al moderador —que por lo mismo tampoco entra al CRM—. */
  { prefijo: "/admin/ia-assistant", roles: ["propietario", "asesor", "operador"] },
  /* La configuración del comportamiento no: quien atiende conversaciones no
     tiene por qué poder cambiar el modelo, la temperatura ni el tono con que
     habla la empresa. */
  { prefijo: "/admin/ia-assistant/configuracion", roles: ["propietario"] },
  /* Donde vuelve Google tras autorizar. Por prefijo caería en la regla de
     arriba —propietario y asesor—, pero conectar una cuenta de Google es
     configuración: quien atiende conversaciones no cambia con qué credenciales
     opera la empresa. */
  { prefijo: "/admin/ia-assistant/google", roles: ["propietario"] },
  { prefijo: "/admin/leads", roles: ["propietario", "asesor", "operador"] },
  /* Dimensionamiento existe solo en Energy. Lo alcanzan las mismas personas que
     atienden prospectos, porque es la herramienta con la que se les responde
     cuánto cuesta: separarla del CRM obligaría a pedirle el cálculo a otro. */
  { prefijo: "/admin/dimensionamiento", roles: ["propietario", "asesor", "operador"] },

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
