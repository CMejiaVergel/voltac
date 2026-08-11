import * as React from "react";
import Link from "next/link";
import { FileText, Sun } from "lucide-react";
import { listarEstudios, listarLeads } from "../acciones";
import { Calculadora } from "./Calculadora";

/**
 * Módulo de Dimensionamiento.
 *
 * Vive en el núcleo por consistencia con el resto de módulos, pero en la
 * práctica es exclusivo de Voltac Energy: es lo único que se monta en
 * `apps/energy` y no en `apps/systems`. La separación real la hace el menú y
 * las reglas de acceso, no un condicional aquí.
 */
export default async function DimensionamientoPage() {
  const [leads, estudios] = await Promise.all([listarLeads(), listarEstudios(8)]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-primary"
            style={{ fontFamily: "Akira Expanded, sans-serif" }}
          >
            DIMENSIONAMIENTO
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Calculadora de sistemas fotovoltaicos. Los mismos números que usa el asistente de WhatsApp cuando
            asesora a un prospecto: el motor es uno solo, así que lo que se calcula aquí y lo que se le dice a un
            cliente por chat no pueden discrepar.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold shrink-0">
          <Sun size={14} />
          Precios de referencia
        </div>
      </div>

      <Calculadora leads={leads} />

      {estudios.length > 0 && (
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Estudios recientes</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Guardan el cálculo tal como se hizo. Si mañana cambia un precio, un estudio ya entregado sigue
                mostrando la cifra que se le dijo al cliente.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border">
            {estudios.map((e) => (
              <div key={e.id} className="py-2.5 flex items-center gap-3 text-[13px]">
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <span className="font-semibold text-secondary">{e.titulo}</span>
                {e.leadNombre && (
                  <Link
                    href={`/admin/leads?id=${e.leadId}`}
                    className="text-primary hover:underline text-[12px]"
                  >
                    {e.leadNombre}
                  </Link>
                )}
                {e.calificacion && (
                  <span className="text-[11px] text-muted-foreground">
                    {e.calificacion.puntaje} pts · {e.calificacion.nivel}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                  {new Date(e.creadoEn + "Z").toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {e.creadoPor && ` · ${e.creadoPor}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
