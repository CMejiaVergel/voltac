import * as React from "react";
import { PlugZap } from "lucide-react";

/**
 * Lo que se ve cuando una línea no tiene asistente configurado.
 *
 * Antes decía "cuando esté configurada, aquí se ajusta cómo responde" y ya. Eso
 * está bien mientras la línea no exista, pero es exasperante justo cuando uno
 * está intentando configurarla: no dice qué falta, ni dónde, ni cómo se sabe si
 * quedó. Alguien que acaba de levantar el segundo asistente y ve esto no tiene
 * ninguna pista de por dónde seguir.
 *
 * Nombra las dos variables. No es información sensible —son nombres, no
 * valores— y solo la ve quien ya entró al panel.
 */
export function SinAsistente({ nombreLinea }: { nombreLinea?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 md:p-12">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <PlugZap size={22} />
        </div>
        <h2 className="text-lg font-bold mt-4">
          {nombreLinea ? `${nombreLinea} todavía no tiene asistente` : "Esta línea todavía no tiene asistente"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          El módulo está completo, pero no sabe con qué asistente hablar. Faltan dos variables en el archivo{" "}
          <span className="font-mono text-xs">.env</span> de esta aplicación:
        </p>

        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-left">
          <code className="block text-[12px] font-mono text-secondary leading-relaxed">
            ASISTENTE_URL=http://127.0.0.1:3021
            <br />
            ASISTENTE_TOKEN=<span className="text-muted-foreground">…</span>
          </code>
        </div>

        <div className="mt-4 text-[12px] text-muted-foreground text-left space-y-2 leading-relaxed">
          <p>
            <strong className="text-secondary">El puerto</strong> es el del proceso que atiende esta línea. Cada
            asistente tiene el suyo: si aquí se pone el de la otra marca, este panel mostraría sus
            conversaciones.
          </p>
          <p>
            <strong className="text-secondary">El token</strong> tiene que ser idéntico al{" "}
            <span className="font-mono">INTEGRACION_TOKEN</span> del asistente. Si no coinciden, el módulo carga
            pero todo responde &laquo;no autorizado&raquo;.
          </p>
          <p>Después de editarlo hay que reiniciar esta aplicación; no se recarga solo.</p>
        </div>
      </div>
    </div>
  );
}
