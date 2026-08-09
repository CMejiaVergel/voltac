import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfig, verifySession } from "./auth";

/**
 * Portero único de las dos líneas de negocio.
 *
 * Esta lógica vivía duplicada en los dos `proxy.ts`, uno por aplicación, y esa
 * duplicación ya costó dos incidentes el mismo día: al montar contabilidad en
 * Energy, sus rutas quedaron respondiendo 200 sin sesión porque la lista de
 * prefijos protegidos de esa app no se había actualizado. Con una sola
 * implementación, proteger algo nuevo se hace una vez y las dos marcas quedan
 * cubiertas.
 *
 * Tres responsabilidades:
 *
 *  1. **Control de acceso** a /admin y a las APIs internas, en el servidor,
 *     antes de que se ejecute código de página.
 *  2. **Cabeceras de seguridad** en todo el sitio.
 *  3. **Invisibilidad del panel**: sin sesión responde 404, no un redirect al
 *     login. Un redirect confirma que la ruta existe; un 404 no dice nada.
 */

/**
 * Rutas que exigen sesión administrativa.
 *
 * Fuera de esta lista, deliberadamente:
 *
 *  - `/api/uploads` sirve las imágenes de proyectos y noticias que se muestran
 *    en las páginas públicas. Su protección es otra —contención de ruta y lista
 *    blanca de extensiones dentro del endpoint—, no el control de acceso.
 *  - `/api/leads` (solo existe en Energy) se autentica con token Bearer para la
 *    ingesta externa de prospectos: es código llamando a código, no una
 *    persona con sesión. Es la base de la ingesta multicanal.
 *  - `/api/analytics` recibe eventos del sitio público; valida el tipo de
 *    evento y no expone lectura.
 */
export const PROTECTED_PREFIXES = ["/admin", "/api/accounting"];

/** Única puerta de entrada; se sirve siempre. */
export const LOGIN_PATH = "/admin/login";

function alcanza(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

function cabecerasSeguridad(response: NextResponse, esAdmin: boolean): NextResponse {
  const h = response.headers;

  h.set("X-Content-Type-Options", "nosniff");
  // SAMEORIGIN y no DENY: el módulo Preview del panel embebe el propio sitio.
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  );
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  if (esAdmin) {
    // Aunque el panel responde 404 sin sesión, si un buscador llegara a verlo
    // esta cabecera lo saca del índice. Es más fuerte que robots.txt, que
    // además es público y delataría la ruta.
    h.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    h.set("Cache-Control", "no-store, max-age=0");
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protegida = PROTECTED_PREFIXES.some((p) => alcanza(pathname, p));

  if (!protegida) return cabecerasSeguridad(NextResponse.next(), false);
  if (pathname === LOGIN_PATH) return cabecerasSeguridad(NextResponse.next(), true);

  const config = adminConfig();
  const sesion = config
    ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, config.secret)
    : null;

  if (!sesion) {
    // Para APIs, un 401 honesto: quien las consume es código, no una persona.
    if (pathname.startsWith("/api/")) {
      return cabecerasSeguridad(NextResponse.json({ error: "No autorizado" }, { status: 401 }), true);
    }
    // Para el panel, 404: indistinguible de una ruta que no existe.
    return cabecerasSeguridad(
      new NextResponse(null, { status: 404, headers: { "content-type": "text/html" } }),
      true,
    );
  }

  return cabecerasSeguridad(NextResponse.next(), true);
}
