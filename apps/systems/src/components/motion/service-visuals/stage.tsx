"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Andamiaje común de las escenas de servicio.
 *
 * Cada servicio tiene una miniatura animada que explica de un vistazo qué
 * hace. Todas comparten tres reglas:
 *
 *  1. **Solo se animan en pantalla.** `useInView` corta el bucle cuando la
 *     tarjeta sale del viewport. Con siete escenas en una misma página, dejar
 *     todas girando a la vez sería un derroche.
 *  2. **Estado final estático con `prefers-reduced-motion`.** La escena sigue
 *     siendo legible: se ve el resultado, no el recorrido.
 *  3. **Mismo lenguaje visual**: superficies blancas con borde suave, acentos
 *     en azul de marca, y profundidad con `perspective` en lugar de sombras
 *     pesadas. Se leen como interfaz, no como ilustración.
 */

export const STAGE_HEIGHT = 162;

export function useStage() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotion();

  return { ref, reduced, play: inView && !reduced };
}

export function Stage({
  children,
  className,
  stageRef,
  perspective = 900,
}: {
  children: React.ReactNode;
  className?: string;
  stageRef: React.RefObject<HTMLDivElement | null>;
  perspective?: number;
}) {
  return (
    <div
      ref={stageRef}
      aria-hidden
      className={`relative w-full overflow-hidden select-none pointer-events-none ${className ?? ""}`}
      style={{ height: STAGE_HEIGHT, perspective }}
    >
      {children}
    </div>
  );
}

/** Panel blanco con borde: la unidad básica de todas las escenas. */
export function Panel({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-white border border-border/70 rounded-lg shadow-[0_2px_8px_rgba(10,15,30,0.06)] ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

/** Barra gris que representa una línea de texto o un dato. */
export function Bar({
  w,
  className,
  h = 4,
}: {
  w: number | string;
  h?: number;
  className?: string;
}) {
  return (
    <span
      className={`block rounded-full bg-secondary/15 ${className ?? ""}`}
      style={{ width: typeof w === "number" ? `${w}px` : w, height: h }}
    />
  );
}

/** Curva de easing compartida con el resto del sitio. */
export const LOOP_EASE = [0.4, 0, 0.2, 1] as const;
