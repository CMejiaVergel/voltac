"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Registra visitas y tiempo de permanencia.
 *
 * Sobre el envío al salir: `fetch` con `keepalive` no siempre llega cuando la
 * pestaña se está cerrando —el navegador puede cancelarlo—. `sendBeacon` está
 * hecho exactamente para eso: el navegador se compromete a entregarlo aunque
 * el documento ya no exista. Se usa cuando está disponible y se cae a `fetch`
 * si no.
 *
 * También se escucha `visibilitychange` además de `beforeunload`: en móvil, el
 * usuario rara vez "cierra" una pestaña, la deja en segundo plano, y ahí
 * `beforeunload` no dispara. Sin eso, el tiempo de permanencia en teléfonos
 * quedaba sin registrar casi siempre.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // El panel administrativo no se mide: no es tráfico de clientes.
    if (!pathname || pathname.startsWith("/admin")) return;

    const inicio = Date.now();
    let enviado = false;

    const enviar = (payload: Record<string, unknown>) => {
      const cuerpo = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", new Blob([cuerpo], { type: "application/json" }));
        return;
      }
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cuerpo,
        keepalive: true,
      }).catch(() => undefined);
    };

    enviar({
      event: "page_view",
      path: pathname,
      referrer: document.referrer || "",
    });

    const registrarPermanencia = () => {
      if (enviado) return;
      const segundos = Math.floor((Date.now() - inicio) / 1000);
      if (segundos <= 1) return; // un rebote inmediato no dice nada
      enviado = true;
      enviar({ event: "time_spent", path: pathname, duration: segundos });
    };

    const alOcultar = () => {
      if (document.visibilityState === "hidden") registrarPermanencia();
    };

    window.addEventListener("beforeunload", registrarPermanencia);
    document.addEventListener("visibilitychange", alOcultar);

    return () => {
      registrarPermanencia();
      window.removeEventListener("beforeunload", registrarPermanencia);
      document.removeEventListener("visibilitychange", alOcultar);
    };
  }, [pathname]);

  return null;
}

/** Marca un clic en el botón de contacto. Se llama desde el propio botón. */
export function registrarClicCotizar(path: string): void {
  const cuerpo = JSON.stringify({ event: "click_cotizar", path });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([cuerpo], { type: "application/json" }));
    return;
  }
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => undefined);
}
