"use client";

import * as React from "react";
import { ChevronDown, HelpCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "../../utils";
import { ayudaDe } from "../recibo";

/**
 * Un campo del formulario con la ayuda de dónde sacar el dato.
 *
 * La ayuda va plegada, no en un tooltip. Un tooltip se pierde al mover el ratón
 * y no se puede leer con la factura en la mano mientras se escribe; un bloque
 * que se queda abierto sí. Y va por operador, porque cada empresa de energía
 * llama distinto a lo mismo y "busque el costo unitario" no le sirve a quien
 * tiene delante una factura de Afinia.
 */
export function Campo({
  campo,
  etiqueta,
  children,
  sufijo,
  className,
}: {
  /** Clave en la tabla de ayuda. Sin ella el campo se pinta sin el enlace. */
  campo?: string;
  etiqueta: string;
  children: React.ReactNode;
  sufijo?: string;
  className?: string;
}) {
  const [abierta, setAbierta] = React.useState(false);
  const ayuda = campo ? ayudaDe(campo) : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-bold text-secondary/70 uppercase tracking-wider">{etiqueta}</label>
        {ayuda && (
          <button
            type="button"
            onClick={() => setAbierta((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
          >
            <HelpCircle size={12} />
            ¿Dónde lo encuentro?
            <ChevronDown size={11} className={cn("transition-transform", abierta && "rotate-180")} />
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        {children}
        {sufijo && (
          <span className="absolute right-3 text-xs text-muted-foreground pointer-events-none font-medium">
            {sufijo}
          </span>
        )}
      </div>

      {ayuda && abierta && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2.5 text-[12px] leading-relaxed">
          <p className="text-secondary">{ayuda.queEs}</p>

          <div className="space-y-1">
            {ayuda.donde.map((d) => (
              <div key={d.operador} className="flex gap-2">
                <span className="font-bold text-secondary shrink-0 w-[130px]">{d.operador}</span>
                <span className="text-muted-foreground">{d.instruccion}</span>
              </div>
            ))}
          </div>

          {ayuda.alternativa && (
            <p className="flex gap-1.5 items-start text-muted-foreground">
              <Lightbulb size={13} className="shrink-0 mt-0.5 text-amber-500" />
              {ayuda.alternativa}
            </p>
          )}

          {ayuda.cuidado && (
            <p className="flex gap-1.5 items-start text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              {ayuda.cuidado}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const entradaClase =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
