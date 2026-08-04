"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { PROCESS_STEPS } from "@/content/services";
import { EASE } from "./Reveal";

/**
 * "De la conversación al resultado": los cuatro pasos unidos por una línea
 * que se va llenando a medida que el visitante avanza.
 *
 * El progreso está atado al scroll, no a un temporizador: la animación
 * *narra* el proceso en lugar de decorarlo. En escritorio la línea es
 * horizontal; en móvil, vertical, porque los pasos se apilan.
 */
export function ProcessTimeline() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 55%"],
  });

  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative">
      {/* Riel horizontal (escritorio) */}
      <div className="hidden lg:block absolute top-0 left-0 right-0 h-[2px] bg-border" aria-hidden>
        {!reduced && (
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-primary to-accent"
            style={{ scaleX: progress }}
          />
        )}
      </div>

      {/* Riel vertical (móvil y tablet) */}
      <div className="lg:hidden absolute top-0 bottom-0 left-0 w-[2px] bg-border" aria-hidden>
        {!reduced && (
          <motion.div
            className="w-full origin-top bg-gradient-to-b from-primary to-accent"
            style={{ scaleY: progress }}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-10 lg:gap-8 pl-8 lg:pl-0 pt-0 lg:pt-10">
        {PROCESS_STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            className="relative"
            initial={reduced ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
          >
            {/* Nodo sobre el riel */}
            <span
              aria-hidden
              className="absolute -left-[38px] top-1 lg:left-0 lg:-top-[46px] w-3 h-3 rounded-full bg-primary ring-4 ring-white"
            />
            <span
              aria-hidden
              className="absolute -left-[38px] top-1 lg:left-0 lg:-top-[46px] w-3 h-3 rounded-full bg-accent soft-pulse"
            />

            <span className="block text-3xl font-black text-primary/20 tracking-tighter mb-3 lg:mb-4">
              {step.number}
            </span>
            <h3 className="text-lg font-black mb-3 leading-tight">{step.title}</h3>
            <p className="text-secondary/60 font-light text-sm leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
