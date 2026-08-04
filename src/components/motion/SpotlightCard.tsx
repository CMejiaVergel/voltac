"use client";

import * as React from "react";
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Tarjeta con foco que sigue al puntero.
 *
 * Dos efectos superpuestos: un halo suave sobre el contenido y un borde que
 * se ilumina solo en el tramo más cercano al cursor. Es el recurso que hace
 * que una grilla de tarjetas deje de sentirse como una tabla estática, sin
 * recurrir a movimiento llamativo — apropiado para un público corporativo.
 *
 * En dispositivos táctiles no hay puntero: la tarjeta se queda quieta y no
 * pasa nada, que es exactamente lo que debe ocurrir.
 */
export function SpotlightCard({
  children,
  className,
  radius = 260,
  intensity = 0.13,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  intensity?: number;
  as?: "div" | "article";
} & React.ComponentPropsWithoutRef<"div">) {
  const reduced = useReducedMotion();
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);

  const glow = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, rgba(96,165,250,${intensity}), transparent 72%)`;
  const border = useMotionTemplate`radial-gradient(${radius * 0.8}px circle at ${mouseX}px ${mouseY}px, rgba(96,165,250,0.55), transparent 70%)`;

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handleLeave = () => {
    mouseX.set(-9999);
    mouseY.set(-9999);
  };

  const MotionTag = Tag === "article" ? motion.article : motion.div;

  return (
    <MotionTag
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("group/spot relative isolate", className)}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {/* Borde iluminado: una capa con el degradado recortado a un anillo */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{
            background: border,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      )}

      {/* Halo interior */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{ background: glow }}
        />
      )}

      {children}
    </MotionTag>
  );
}
