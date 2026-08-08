"use client";

import * as React from "react";
import {
  DiagnosticoScene,
  AutomatizacionScene,
  AtencionScene,
  SoftwareScene,
  InformacionScene,
  PresenciaScene,
  OperacionesScene,
} from "./scenes";
import { STAGE_HEIGHT } from "./stage";

/**
 * Escena animada por servicio.
 *
 * El mapa va contra el `slug` del portafolio (`src/content/services.ts`).
 * Si mañana se agrega un servicio nuevo sin escena, no se rompe nada: la
 * tarjeta simplemente se muestra sin miniatura.
 */
const SCENES: Record<string, React.ComponentType> = {
  "diagnostico-consultoria-formacion": DiagnosticoScene,
  "automatizacion-trabajo-repetitivo": AutomatizacionScene,
  "atencion-automatica-clientes": AtencionScene,
  "programas-y-aplicaciones-a-la-medida": SoftwareScene,
  "informacion-ordenada-para-decidir": InformacionScene,
  "presencia-digital-y-clientes": PresenciaScene,
  "operaciones-y-cumplimiento": OperacionesScene,
};

export function ServiceVisual({
  slug,
  className,
  scale = 1,
  children,
}: {
  slug: string;
  className?: string;
  /**
   * Reduce la escena sin rehacerla. Las miniaturas del home usan ~0.8: a ese
   * tamaño los micro-textos dejan de leerse y pasan a funcionar como textura,
   * que es justo lo que se busca en una tarjeta de resumen. El detalle
   * legible vive en /servicios, a escala 1.
   */
  scale?: number;
  /** Contenido superpuesto (número del servicio, icono…) */
  children?: React.ReactNode;
}) {
  const Scene = SCENES[slug];
  if (!Scene) return null;

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-b from-white/70 to-white/20 border border-border/40 overflow-hidden ${className ?? ""}`}
      style={{ height: Math.round(STAGE_HEIGHT * scale) }}
    >
      <div className="absolute inset-0 bg-dots opacity-30" aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full" style={{ transform: `scale(${scale})` }}>
          <Scene />
        </div>
      </div>
      {children}
    </div>
  );
}

export const SERVICE_VISUAL_SLUGS = Object.keys(SCENES);
