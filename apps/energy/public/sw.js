/*
 * Service worker del panel.
 *
 * Se sirve desde la raiz pero se registra con alcance `/admin/`. Desde la raiz
 * no lo tapa el portero de sesion --que responde 404 a lo que cuelga de
 * `/admin` sin cookie-- y con el alcance acotado no toca las paginas publicas.
 *
 * Es deliberadamente CONSERVADOR. Un service worker agresivo en un panel de
 * administracion es una mala idea: sirve datos viejos con aspecto de nuevos, y
 * quien mira un tablero de prospectos no tiene forma de saber que esta viendo
 * lo de ayer. Aqui solo hace dos cosas:
 *
 *  1. Guarda los archivos estaticos --iconos, imagenes, fuentes-- que no
 *     cambian entre despliegues. Eso es lo que hace que la aplicacion abra
 *     rapido y sin destello.
 *  2. Da una pantalla decente cuando no hay red, en vez del dinosaurio del
 *     navegador.
 *
 * Lo que NO hace: cachear respuestas de `/api`, ni HTML de paginas. Los datos
 * siempre salen de la red. Si no hay red, se dice.
 */

const VERSION = "v1";
const CACHE = `voltac-panel-${VERSION}`;

/* Lo minimo para que la pantalla sin conexion se pinte sin pedir nada. */
const PRECARGA = ["/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  // `skipWaiting` para que un despliegue nuevo mande de inmediato y no se
  // quede esperando a que se cierren todas las pestanas.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const OFFLINE = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Sin conexión</title>
<style>
 body{margin:0;height:100dvh;display:grid;place-items:center;padding:2rem;
      font-family:system-ui,sans-serif;background:#0d1f14;color:#fff;text-align:center}
 h1{font-size:1.25rem;margin:0 0 .5rem}
 p{margin:0;color:#ffffff99;font-size:.9rem;line-height:1.5;max-width:22rem}
</style></head>
<body><div>
 <h1>Sin conexión</h1>
 <p>El panel necesita internet para mostrar datos actualizados. En cuanto vuelva la señal, recarga.</p>
</div></body></html>`;

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET y solo del propio origen. Lo demas pasa de largo.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Los datos NUNCA se cachean. Ver la nota de arriba.
  if (url.pathname.startsWith("/api/")) return;

  /* Estaticos: primero la cache, y si no esta se pide y se guarda. Llevan hash
     en el nombre o no cambian nunca, asi que servir la copia es seguro. */
  const esEstatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(url.pathname);

  if (esEstatico) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copia));
            }
            return res;
          }),
      ),
    );
    return;
  }

  /* Navegacion: siempre red. Si falla, la pantalla sin conexion. Nunca una
     version guardada del panel, que mostraria cifras viejas como si fueran
     de ahora. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () => new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    );
  }
});
