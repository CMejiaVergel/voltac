import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfig, verifySession } from "@voltac/core/auth";

/**
 * Portero único del sitio.
 *
 * Antes no existía: el panel se "protegía" desde el navegador, y las rutas de
 * API no se protegían en absoluto. Aquí se resuelven tres cosas a la vez:
 *
 *  1. **Control de acceso real** a /admin y a las APIs internas, del lado del
 *     servidor, antes de que se ejecute cualquier código de página.
 *  2. **Cabeceras de seguridad** para todo el sitio.
 *  3. **Invisibilidad del panel**: las rutas administrativas responden 404 a
 *     quien no tenga sesión, en vez de redirigir a un login. Un 404 no revela
 *     que ahí hay algo; un redirect a /admin/login confirma que existe.
 */

/**
 * Rutas administrativas: no existen para quien no está autenticado.
 *
 * `/api/uploads` queda deliberadamente FUERA: sirve las imágenes de proyectos y
 * noticias que se muestran en las páginas públicas, así que exigir sesión ahí
 * rompería el sitio. Su protección es otra —contención de ruta y lista blanca
 * de extensiones dentro del propio endpoint—, no el control de acceso.
 */
const PROTECTED_PREFIXES = ["/admin", "/api/accounting"];

/** Única puerta de entrada; se sirve siempre. */
const LOGIN_PATH = "/admin/login";

function securityHeaders(response: NextResponse, isAdmin: boolean): NextResponse {
  const headers = response.headers;

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // HSTS: el dominio ya sirve por HTTPS. Un año, con subdominios.
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  if (isAdmin) {
    // Cinturón y tirantes: aunque el panel responde 404 sin sesión, si algún
    // buscador llegara a verlo, esta cabecera lo saca del índice. Es más fuerte
    // que robots.txt, que además es público y delataría la ruta.
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    headers.set("Cache-Control", "no-store, max-age=0");
  }

  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return securityHeaders(NextResponse.next(), false);
  }

  // El login es la excepción: tiene que ser alcanzable sin sesión.
  if (pathname === LOGIN_PATH) {
    return securityHeaders(NextResponse.next(), true);
  }

  const config = adminConfig();
  const session = config
    ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, config.secret)
    : null;

  if (!session) {
    // Para APIs, un 401 honesto: quien las consume es código, no una persona.
    if (pathname.startsWith("/api/")) {
      return securityHeaders(
        NextResponse.json({ error: "No autorizado" }, { status: 401 }),
        true,
      );
    }

    // Para el panel, 404. Deliberadamente indistinguible de una ruta que no
    // existe: un atacante que sondea /admin no obtiene confirmación de nada.
    return securityHeaders(
      new NextResponse(null, { status: 404, headers: { "content-type": "text/html" } }),
      true,
    );
  }

  return securityHeaders(NextResponse.next(), true);
}

export const config = {
  /*
   * Se excluyen los assets estáticos y el optimizador de imágenes: no necesitan
   * pasar por aquí y hacerlo costaría latencia en cada petición.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml)$).*)"],
};
