import { manifiestoPanel } from "@voltac/core/admin-shell";

/**
 * El manifiesto del panel.
 *
 * Vive en la RAIZ y no bajo `/admin`, y no es una preferencia: el portero
 * responde 404 a todo lo que cuelga de `/admin` sin una sesion con el rol
 * adecuado, y el navegador pide el manifiesto SIN credenciales. Colgado ahi
 * daba 404 siempre y la instalacion no se ofrecia nunca. Costo verlo porque la
 * ruta funcionaba perfectamente al abrirla a mano, ya con sesion.
 *
 * Que este en la raiz no lo hace publico de mas: no contiene nada privado
 * --nombre, colores e iconos-- y `scope` sigue acotado a `/admin`, que es lo
 * que de verdad decide que se instala.
 *
 * Tampoco se usa `app/manifest.ts`, que es la via de Next, porque esa sirve
 * en `/manifest.webmanifest` y se anuncia desde la raiz: a quien entra a leer
 * el blog le ofreceria instalar una herramienta interna que no puede abrir.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(manifiestoPanel("energy"), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
