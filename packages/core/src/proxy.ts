import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfig, verifySession } from "./auth";
import { INICIO, rolesPara } from "./roles";

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
 * Cuatro responsabilidades:
 *
 *  1. **Autenticación**: sin sesión válida no se pasa de aquí.
 *  2. **Autorización**: qué rol alcanza qué ruta, según el mapa de `roles.ts`.
 *  3. **Cabeceras de seguridad** en todo el sitio.
 *  4. **Invisibilidad**: lo que no le corresponde a alguien responde 404, no un
 *     mensaje de acceso denegado. Un 403 confirma que el módulo existe; un 404
 *     no dice nada. Vale tanto para un desconocido como para el moderador, que
 *     trabaja también con otras empresas y no tiene por qué conocer el mapa
 *     completo del panel.
 */

/** Única puerta de entrada; se sirve siempre. */
export const LOGIN_PATH = "/admin/login";

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

function noEncontrado(): NextResponse {
  return new NextResponse(null, { status: 404, headers: { "content-type": "text/html" } });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const permitidos = rolesPara(pathname);
  if (permitidos === null) return cabecerasSeguridad(NextResponse.next(), false);
  if (pathname === LOGIN_PATH) return cabecerasSeguridad(NextResponse.next(), true);

  const config = adminConfig();
  const sesion = config
    ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, config.secret)
    : null;

  const esApi = pathname.startsWith("/api/");

  if (!sesion) {
    // Para APIs, un 401 honesto: quien las consume es código, no una persona.
    if (esApi) {
      return cabecerasSeguridad(NextResponse.json({ error: "No autorizado" }, { status: 401 }), true);
    }
    return cabecerasSeguridad(noEncontrado(), true);
  }

  if (!permitidos.includes(sesion.rol)) {
    // El login siempre manda a /admin. Quien no sea propietario no tiene
    // dashboard general, así que se le lleva a su propia portada en lugar de
    // recibirlo con un 404 justo después de entrar bien.
    if (pathname === "/admin") {
      return cabecerasSeguridad(
        NextResponse.redirect(new URL(INICIO[sesion.rol], request.url)),
        true,
      );
    }
    if (esApi) {
      return cabecerasSeguridad(NextResponse.json({ error: "Sin permiso" }, { status: 403 }), true);
    }
    return cabecerasSeguridad(noEncontrado(), true);
  }

  return cabecerasSeguridad(NextResponse.next(), true);
}
