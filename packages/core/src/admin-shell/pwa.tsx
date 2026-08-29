"use client";

import * as React from "react";
import { Download, Share, X } from "lucide-react";

/**
 * Lo que convierte el panel en una aplicacion instalable.
 *
 * Dos piezas que van juntas y se montan una sola vez, desde el layout del
 * panel:
 *
 *  1. El registro del service worker, que es el requisito tecnico para que
 *     Android ofrezca instalar y para que la aplicacion abra aunque la red
 *     este mal.
 *  2. La invitacion a instalar, que es el requisito humano: sin ella casi
 *     nadie descubre que se puede.
 *
 * El service worker se sirve desde la raiz pero se registra con alcance
 * `/admin/`. Es a proposito: en la raiz no lo tapa el portero de sesion --que
 * responde 404 a lo que cuelga de `/admin` sin cookie-- y con el alcance
 * acotado no toca las paginas publicas, que son las que tienen que seguir
 * siendo rapidas de indexar y libres de cache intermedia.
 */

/** El evento de instalacion de Chrome no esta en los tipos del DOM. */
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CLAVE_DESCARTE = "voltac:instalar-descartado";

/** Si ya se esta ejecutando como aplicacion instalada. */
function esInstalada(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iOS no implementa display-mode y usa esto en su lugar.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function RegistrarServiceWorker() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    /* En desarrollo no se registra. Un service worker sirviendo archivos de
       cache mientras se edita codigo produce el peor rato de depuracion que
       existe: cambias algo, recargas, y sigue apareciendo lo viejo. */
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js", { scope: "/admin/" }).catch((err) => {
      // No se le cuenta a nadie: sin service worker el panel funciona igual,
      // solo deja de poder instalarse.
      console.debug("Service worker no registrado", err);
    });
  }, []);

  return null;
}

/**
 * Barra que invita a instalar, solo cuando tiene sentido.
 *
 * No aparece si ya esta instalada, si la persona la descarto antes, o si el
 * navegador no lo permite. En iOS no existe el evento de instalacion, asi que
 * ahi se explica el gesto a mano: es la unica via, y sin explicarla nadie la
 * encuentra.
 */
export function InstalarApp() {
  const [evento, setEvento] = React.useState<EventoInstalacion | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    if (esInstalada()) return;
    if (localStorage.getItem(CLAVE_DESCARTE)) return;

    if (esIOS()) {
      setIos(true);
      setVisible(true);
      return;
    }

    const alPoder = (e: Event) => {
      // Sin esto Chrome muestra su propia barra, que aparece donde quiere y
      // dice lo que quiere.
      e.preventDefault();
      setEvento(e as EventoInstalacion);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", alPoder);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", alPoder);
  }, []);

  if (!visible) return null;

  const descartar = () => {
    localStorage.setItem(CLAVE_DESCARTE, "1");
    setVisible(false);
  };

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "dismissed") localStorage.setItem(CLAVE_DESCARTE, "1");
    setVisible(false);
  };

  return (
    /* Va arriba y no abajo: abajo esta la barra de navegacion, y una tarjeta
       flotante encima de ella tapa justo lo que la persona esta usando. */
    <div
      className="animate-bajar fixed inset-x-3 top-3 z-50 flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-lg md:hidden"
      style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
      role="dialog"
      aria-label="Instalar la aplicación"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instalar el panel</p>
        {ios ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            Toca <Share size={13} className="inline shrink-0" /> y luego
            <span className="font-medium text-foreground">Añadir a pantalla de inicio</span>
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">Ábrelo como una app, sin el navegador alrededor.</p>
        )}
      </div>

      {!ios && (
        <button
          type="button"
          onClick={instalar}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-95"
        >
          <Download size={15} />
          Instalar
        </button>
      )}

      <button
        type="button"
        onClick={descartar}
        aria-label="Ahora no"
        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition active:scale-90 active:bg-muted"
      >
        <X size={16} />
      </button>
    </div>
  );
}
