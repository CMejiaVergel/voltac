import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_RECORDADA,
  SESSION_TTL_RECORDADA,
  adminConfig,
  signSession,
  verifySession,
} from "./auth";
import { alcanzaMarca, INICIO, rolesPara } from "./roles";
import { estadoDeCuenta } from "./usuarios";
import { currentVertical } from "./vertical";

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
 *
 * Sobre consultar la base desde aquí: desde Next 16 el proxy corre en el
 * runtime **Node**, no en Edge, y su `runtime` no se puede configurar. Eso
 * permite comprobar el estado vigente de la cuenta en cada petición protegida,
 * que es lo que hace que desactivar a alguien surta efecto en el acto y no
 * ocho horas después. La consulta se hace **solo** cuando la ruta está
 * protegida y la firma ya resultó válida: las páginas públicas, que son la
 * inmensa mayoría del tráfico, no tocan la base.
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

  const sinAcceso = () =>
    esApi
      ? // Para APIs, un 401 honesto: quien las consume es código, no una persona.
        cabecerasSeguridad(NextResponse.json({ error: "No autorizado" }, { status: 401 }), true)
      : cabecerasSeguridad(noEncontrado(), true);

  /*
   * Sin sesion se manda al login, NO un 404.
   *
   * El 404 existe para que lo que no te corresponde no confirme siquiera que
   * existe, y esa regla se mantiene intacta mas abajo: quien SI tiene sesion
   * pero no alcanza una seccion sigue recibiendo un 404, que es donde de
   * verdad se protege el mapa de modulos.
   *
   * Aqui no protege nada. `/admin/login` ya se sirve en abierto --esta unas
   * lineas mas arriba-- asi que la existencia de un panel con acceso ya es
   * publica, y esta redireccion es IDENTICA exista o no la ruta pedida: de
   * `/admin/contabilidad` y de `/admin/pepito` sale exactamente lo mismo.
   *
   * Lo que si hacia el 404 era romper el panel instalado como aplicacion. Su
   * `start_url` es `/admin`, y `noEncontrado()` devuelve un cuerpo vacio: al
   * caducar la sesion, abrir la app mostraba una pantalla en blanco sin
   * explicacion ni salida. Con la sesion de ocho horas, eso pasaba cada
   * manana.
   */
  if (!sesion) {
    if (esApi) return sinAcceso();

    const destino = new URL(LOGIN_PATH, request.url);
    /* A donde volver despues de entrar. Solo rutas internas del panel: sin
       esta comprobacion, `?next=//otrositio` convierte el login en un salto a
       cualquier parte de internet con nuestro dominio de por medio. */
    const pedida = `${pathname}${request.nextUrl.search}`;
    if (pathname.startsWith("/admin/") && !pathname.startsWith("//") && pathname !== LOGIN_PATH) {
      destino.searchParams.set("next", pedida);
    }
    return cabecerasSeguridad(NextResponse.redirect(destino), true);
  }

  /*
   * La firma solo prueba que el token lo emitimos nosotros y que no ha
   * caducado. Falta lo que puede haber cambiado desde entonces: que la cuenta
   * siga activa y que el rol siga siendo el mismo.
   *
   * Si el rol cambio, se invalida la sesion en lugar de aplicar el nuevo: la
   * interfaz pinta el menu a partir del rol del token, y dejar pasar con uno
   * distinto mostraria una navegacion que no corresponde con lo que el
   * servidor permite. Volver a entrar deja las dos cosas en su sitio.
   */
  const cuenta = await estadoDeCuenta(sesion.sub);
  if (!cuenta || !cuenta.activo || cuenta.rol !== sesion.rol) return sinAcceso();

  /*
   * Y que la cuenta sea de ESTA marca.
   *
   * La tabla de usuarios es una sola y las dos aplicaciones la comparten, asi
   * que sin esta comprobacion una cuenta creada para Energy entra igual al
   * panel de Systems y ve su embudo comercial completo. No es una fuga
   * hipotetica: los dos paneles corren el mismo codigo contra la misma tabla de
   * identidad, y lo unico que los separa es en que puerto escucha cada uno.
   *
   * Se comprueba aqui y no solo al entrar porque una cuenta puede cambiar de
   * marca con la sesion ya abierta, igual que puede cambiar de rol.
   */
  if (!alcanzaMarca(cuenta.marca, currentVertical())) return sinAcceso();

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

  const respuesta = NextResponse.next();

  /*
   * Renovacion de la sesion larga mientras se usa.
   *
   * Sin esto, "mantener sesion iniciada" seria un plazo fijo: a los treinta
   * dias exactos la aplicacion vuelve a la pantalla de entrada aunque se este
   * usando a diario. Con la renovacion, el plazo cuenta desde la ULTIMA visita
   * y no desde la primera, que es como se comporta cualquier aplicacion.
   *
   * Se renueva solo cuando ya paso la mitad de la ventana: reescribir la
   * cookie en cada peticion no aporta nada y firma un token por imagen y por
   * hoja de estilos.
   *
   * `ini` es el freno. Es el inicio REAL de la sesion, se conserva intacto
   * entre renovaciones, y pasado el tope absoluto ya no se renueva mas: la
   * sesion caduca y hay que volver a entrar. Sin ese tope, una sesion usada a
   * diario no expiraria nunca.
   */
  if (sesion.rec && config) {
    const ahora = Math.floor(Date.now() / 1000);
    const inicio = sesion.ini ?? sesion.iat;
    const leQueda = sesion.exp - ahora;

    if (leQueda < SESSION_TTL_RECORDADA / 2 && ahora - inicio < SESSION_MAX_RECORDADA) {
      const token = await signSession(sesion.sub, sesion.rol, config.secret, {
        recordar: true,
        ini: inicio,
      });
      respuesta.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_RECORDADA,
      });
    }
  }

  return cabecerasSeguridad(respuesta, true);
}
