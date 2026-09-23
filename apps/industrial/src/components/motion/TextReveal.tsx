"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE } from "./Reveal";

/**
 * Titular que entra palabra por palabra desde debajo de una máscara.
 *
 * Cada palabra vive dentro de un contenedor con `overflow: hidden`, así que
 * no aparece: *emerge*. Es el recurso que separa un titular corporativo de
 * uno plano, y al ser por palabra (no por letra) se mantiene legible y sobrio
 * en textos largos.
 */

export interface Segment {
  text: string;
  /** Aplica el degradado de marca a este tramo */
  highlight?: boolean;
}

interface TextRevealProps {
  segments: Segment[];
  className?: string;
  /** Etiqueta a renderizar: h1, h2, p… */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
}

const wordVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.75, ease: EASE },
  },
};

export function TextReveal({
  segments,
  className,
  as = "h2",
  delay = 0,
  stagger = 0.05,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const Tag = as;

  // Cada palabra conserva de qué tramo viene, para saber si va resaltada.
  const words = segments.flatMap((segment, si) =>
    segment.text
      .split(" ")
      .filter(Boolean)
      .map((word, wi) => ({ word, highlight: segment.highlight, key: `${si}-${wi}` }))
  );

  if (reduced) {
    return (
      <Tag className={className}>
        {words.map(({ word, highlight, key }, i) => (
          <span
            key={key}
            className={highlight ? "text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary" : undefined}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {words.map(({ word, highlight, key }) => (
          <span
            key={key}
            /* pb/-mb dan aire a las colas de las letras (g, j, p) para que la
               máscara no las recorte al final de la animación */
            className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom"
          >
            <motion.span
              variants={wordVariants}
              className={
                highlight
                  ? "inline-block text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary"
                  : "inline-block"
              }
            >
              {word}
            </motion.span>
            <span className="inline-block">&nbsp;</span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
