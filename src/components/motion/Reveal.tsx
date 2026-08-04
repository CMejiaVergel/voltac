"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Sistema de aparición al hacer scroll.
 *
 * Un solo componente para todo el sitio en lugar de repetir
 * `initial/whileInView` en cada pantalla: así el ritmo, la curva y la
 * distancia del movimiento son idénticos en todas las secciones, que es lo
 * que hace que una animación se sienta diseñada y no improvisada.
 *
 * La curva [0.22, 1, 0.36, 1] (easeOutQuint) arranca rápido y frena suave:
 * transmite precisión, no rebote. Es deliberado para un público corporativo.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Direction = "up" | "down" | "left" | "right" | "none";

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
};

interface RevealProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  /** Retraso en segundos antes de arrancar */
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  /** Desenfoque inicial: da sensación de "entrar en foco" */
  blur?: boolean;
  once?: boolean;
  /** Margen del viewport para disparar antes o después */
  amount?: number;
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  direction = "up",
  distance = 24,
  blur = true,
  once = true,
  amount = 0.2,
  className,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        filter: blur ? "blur(6px)" : "blur(0px)",
        ...offsetFor(direction, distance),
      }}
      whileInView={{ opacity: 1, filter: "blur(0px)", x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Contenedor que escalona la entrada de sus hijos `RevealItem`.
 * Preferible a poner `delay: i * 0.1` a mano: el escalonado lo controla el
 * padre y no se desincroniza si cambia el número de elementos.
 */
/** Etiquetas admitidas por los contenedores de aparición */
type RevealTag = "div" | "ul" | "li" | "section";

/* Se devuelve como ElementType a propósito: la alternativa es duplicar la
   firma de props para cada etiqueta, que no aporta seguridad real aquí. */
const motionTag = (tag: RevealTag): React.ElementType =>
  ({ div: motion.div, ul: motion.ul, li: motion.li, section: motion.section }[tag]);

export function RevealGroup({
  children,
  stagger = 0.08,
  delay = 0,
  once = true,
  amount = 0.15,
  className,
  as = "div",
  ...rest
}: {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
  as?: RevealTag;
} & React.ComponentPropsWithoutRef<"div">) {
  const reduced = useReducedMotion();
  const Tag = as as React.ElementType;

  if (reduced) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const MotionTag = motionTag(as);

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE },
  },
};

export function RevealItem({
  children,
  className,
  as = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: RevealTag;
} & React.ComponentPropsWithoutRef<"div">) {
  const reduced = useReducedMotion();
  const Tag = as as React.ElementType;

  if (reduced) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const MotionTag = motionTag(as);

  return (
    <MotionTag
      className={className}
      variants={revealItemVariants}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export { EASE };
