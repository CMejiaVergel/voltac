"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Retícula técnica animada sobre lienzo.
 *
 * Tres capas de lectura:
 *  1. Una matriz de puntos que evoca un plano de ingeniería.
 *  2. Un foco que sigue al puntero y "enciende" los puntos cercanos. Sin
 *     puntero (móvil) el foco recorre la superficie solo, en una órbita lenta.
 *  3. Pulsos que viajan por las líneas de la retícula, como señal por un bus
 *     de datos. Son lo que le da vida industrial a la escena.
 *
 * Decisiones de rendimiento: un único bucle de animación, resolución limitada
 * a 2x, y el lienzo se detiene por completo cuando sale de pantalla.
 * Con `prefers-reduced-motion` se dibuja un solo fotograma estático.
 */

interface Pulse {
  axis: "x" | "y";
  /** Índice de la línea de la retícula por la que viaja */
  line: number;
  position: number;
  speed: number;
  length: number;
}

const GRID = 26; // separación entre puntos, en px CSS
const FOCUS_RADIUS = 190;

export function TechGrid({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    let time = 0;

    // Foco: destino (puntero) y posición suavizada, para que no dé saltos.
    const focus = { x: -9999, y: -9999, tx: -9999, ty: -9999, hasPointer: false };
    let pulses: Pulse[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Un pulso por cada ~340px de superficie, con un mínimo y un máximo.
      const count = Math.max(4, Math.min(9, Math.round((width + height) / 340)));
      pulses = Array.from({ length: count }, () => spawnPulse());
    };

    const spawnPulse = (): Pulse => {
      const axis: "x" | "y" = Math.random() > 0.45 ? "x" : "y";
      const lines = axis === "x" ? Math.floor(height / GRID) : Math.floor(width / GRID);
      return {
        axis,
        line: Math.floor(Math.random() * Math.max(lines, 1)),
        position: Math.random() * (axis === "x" ? width : height),
        speed: 0.6 + Math.random() * 1.5,
        length: 70 + Math.random() * 150,
      };
    };

    const draw = () => {
      if (!running) return;
      time += 0.006;
      ctx.clearRect(0, 0, width, height);

      // Sin puntero, el foco describe una órbita suave (Lissajous).
      if (!focus.hasPointer) {
        focus.tx = width * (0.5 + 0.32 * Math.cos(time * 0.75));
        focus.ty = height * (0.5 + 0.26 * Math.sin(time * 1.05));
      }
      focus.x += (focus.tx - focus.x) * 0.06;
      focus.y += (focus.ty - focus.y) * 0.06;

      // --- Capa 1 y 2: puntos y foco ---
      const cols = Math.ceil(width / GRID) + 1;
      const rows = Math.ceil(height / GRID) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID;
          const y = j * GRID;
          const dx = x - focus.x;
          const dy = y - focus.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let alpha = 0.16;
          let size = 1;

          if (dist < FOCUS_RADIUS) {
            const strength = 1 - dist / FOCUS_RADIUS;
            alpha = 0.16 + strength * 0.72;
            size = 1 + strength * 1.7;
          }

          ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Capa 3: pulsos por las líneas de la retícula ---
      for (let p = 0; p < pulses.length; p++) {
        const pulse = pulses[p];
        pulse.position += pulse.speed;

        const isHorizontal = pulse.axis === "x";
        const track = isHorizontal ? width : height;

        if (pulse.position - pulse.length > track) {
          pulses[p] = spawnPulse();
          pulses[p].position = -pulses[p].length;
          continue;
        }

        const fixed = pulse.line * GRID;
        const head = pulse.position;
        const tail = pulse.position - pulse.length;

        const gradient = isHorizontal
          ? ctx.createLinearGradient(tail, fixed, head, fixed)
          : ctx.createLinearGradient(fixed, tail, fixed, head);
        gradient.addColorStop(0, "rgba(96, 165, 250, 0)");
        gradient.addColorStop(0.75, "rgba(96, 165, 250, 0.45)");
        gradient.addColorStop(1, "rgba(147, 197, 253, 0.95)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (isHorizontal) {
          ctx.moveTo(tail, fixed);
          ctx.lineTo(head, fixed);
        } else {
          ctx.moveTo(fixed, tail);
          ctx.lineTo(fixed, head);
        }
        ctx.stroke();

        // Cabeza del pulso: un punto brillante que deja claro hacia dónde va.
        ctx.fillStyle = "rgba(191, 219, 254, 0.9)";
        ctx.beginPath();
        ctx.arc(isHorizontal ? head : fixed, isHorizontal ? fixed : head, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      focus.hasPointer = true;
      focus.tx = event.clientX - rect.left;
      focus.ty = event.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      focus.hasPointer = false;
    };

    resize();

    if (reduced) {
      // Un solo fotograma: la retícula queda, el movimiento no.
      focus.x = width / 2;
      focus.y = height / 2;
      focus.tx = focus.x;
      focus.ty = focus.y;
      running = true;
      draw();
      running = false;
      cancelAnimationFrame(frame);
      return;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Fuera de pantalla no se gasta ni un fotograma.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          frame = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    /* El puntero se escucha en la sección completa, no en el lienzo: los
       eventos sobre el titular o los botones burbujean hasta ahí, así que el
       foco sigue al cursor por toda la escena y no solo sobre el fondo. */
    const parent =
      (canvas.closest("[data-techgrid-root]") as HTMLElement | null) ??
      canvas.parentElement ??
      canvas;
    parent.addEventListener("pointermove", handlePointerMove);
    parent.addEventListener("pointerleave", handlePointerLeave);

    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
