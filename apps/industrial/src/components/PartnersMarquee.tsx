"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { PARTNERS } from "@/content/partners";

/**
 * Banda de marcas en movimiento continuo. Sin títulos ni etiquetas: solo logos.
 *
 * Los logos que viven como archivo en `public/logos/` se verifican en el cliente
 * antes de pintarlos: si el archivo todavía no existe, la marca simplemente no
 * entra a la banda. Así nunca se ve una imagen rota mientras se consiguen los
 * archivos definitivos. (No se puede usar `onError` sobre el HTML del servidor:
 * la imagen falla antes de que React hidrate y el evento se pierde.)
 */
export function PartnersMarquee() {
  const [loadedLogos, setLoadedLogos] = React.useState<string[]>([]);
  /* La banda giraba siempre, tambien con la seccion fuera de pantalla: eso
     mantiene ocupada la GPU y gasta bateria sin que nadie lo vea. */
  const sectionRef = React.useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.1 });

  React.useEffect(() => {
    let cancelled = false;

    /*
     * Se comprueba con HEAD, no cargando la imagen.
     *
     * `new Image()` sobre un archivo inexistente no falla barato: el servidor
     * responde con la pagina 404 de Next —unos 39 KB de HTML— y el navegador
     * se la descarga entera. Con cinco logos pendientes eran ~195 KB tirados en
     * cada visita para no mostrar nada. HEAD trae solo las cabeceras.
     */
    PARTNERS.filter((p) => p.logo).forEach((partner) => {
      fetch(partner.logo as string, { method: "HEAD" })
        .then((res) => {
          const tipo = res.headers.get("content-type") ?? "";
          if (cancelled || !res.ok || !tipo.startsWith("image/")) return;
          setLoadedLogos((prev) => (prev.includes(partner.name) ? prev : [...prev, partner.name]));
        })
        .catch(() => undefined);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const visible = PARTNERS.filter((p) => p.icon || loadedLogos.includes(p.name));
  if (visible.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-12 bg-secondary border-t border-white/5 relative z-20 overflow-hidden">
      <div
        className="relative w-full overflow-hidden whitespace-nowrap"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <motion.div
          className="flex w-max items-center"
          animate={inView ? { x: ["0%", "-50%"] } : undefined}
          transition={{ ease: "linear", duration: 45, repeat: Infinity }}
        >
          {[...visible, ...visible].map((partner, i) => {
            const Icon = partner.icon;
            return (
              <div
                key={`${partner.name}-${i}`}
                className="group flex flex-col items-center justify-center gap-2.5 px-8 sm:px-10 md:px-14 shrink-0 h-20"
                title={partner.name}
              >
                {Icon ? (
                  <>
                    <Icon
                      size={partner.isWordmark ? 40 : 32}
                      aria-hidden={!partner.isWordmark}
                      aria-label={partner.isWordmark ? partner.name : undefined}
                      className="text-white/45 group-hover:text-white transition-colors duration-300"
                    />
                    {!partner.isWordmark && (
                      <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35 group-hover:text-white/80 transition-colors duration-300 whitespace-nowrap">
                        {partner.name}
                      </span>
                    )}
                  </>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 md:h-12 w-auto max-w-[180px] object-contain opacity-45 group-hover:opacity-100 brightness-0 invert transition-opacity duration-300"
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
