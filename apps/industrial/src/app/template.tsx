"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Transición entre páginas del sitio público.
 *
 * Deliberadamente mínima —opacidad y un desplazamiento de 8px— porque una
 * transición larga entre páginas se vuelve un peaje: se disfruta la primera
 * vez y estorba la décima. Lo justo para que el cambio no se sienta un corte.
 *
 * El panel administrativo queda fuera: allí prima la respuesta inmediata.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced || pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
