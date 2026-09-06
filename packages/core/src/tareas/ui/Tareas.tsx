"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  X,
} from "lucide-react";
import {
  cerrarSinSolucion,
  listarTareas,
  marcarHecha,
  resolverTareaRecibo,
} from "../acciones";
import { ETIQUETA_TIPO, type Tarea, type TipoTarea } from "../tipos";

/**
 * Las tareas del panel.
 *
 * Una lista, no un tablero. Lo que hay que responder al abrirla es "¿qué está
 * bloqueado ahora mismo?", y para eso una columna basta: las pendientes arriba
 * y por urgencia, las cerradas debajo y atenuadas. Un tablero con estados
 * obligaría a arrastrar tarjetas para decir algo que el propio botón ya dice.
 */

const ICONO: Record<TipoTarea, React.ReactNode> = {
  recibo: <FileWarning size={16} />,
  escalamiento: <MessageSquareWarning size={16} />,
  propuesta: <CheckCircle2 size={16} />,
};

function cuando(iso: string): string {
  const t = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).getTime();
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default function Tareas() {
  const [tareas, setTareas] = React.useState<Tarea[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [abierta, setAbierta] = React.useState<number | null>(null);
  const [ocupada, setOcupada] = React.useState<number | null>(null);

  const cargar = React.useCallback(async () => {
    const r = await listarTareas();
    if (r.ok) {
      setTareas(r.datos ?? []);
      setError(null);
    } else {
      setError(r.error ?? "No se pudieron leer las tareas.");
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const pendientes = tareas?.filter((t) => t.estado === "pendiente") ?? [];
  const cerradas = tareas?.filter((t) => t.estado !== "pendiente") ?? [];

  if (tareas === null && !error) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" /> Cargando tareas…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary">
            {pendientes.length === 0
              ? "No hay nada pendiente"
              : `${pendientes.length} ${pendientes.length === 1 ? "tarea pendiente" : "tareas pendientes"}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lo que el asistente no pudo terminar solo y necesita una persona.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted active:scale-95"
          aria-label="Actualizar"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {pendientes.length === 0 && !error && (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Cuando el asistente no pueda leer una factura, escale una conversación o quede una
          propuesta por enviar, aparecerá aquí.
        </p>
      )}

      <div className="space-y-3">
        {pendientes.map((t) => (
          <Fila
            key={t.id}
            tarea={t}
            abierta={abierta === t.id}
            ocupada={ocupada === t.id}
            onAbrir={() => setAbierta(abierta === t.id ? null : t.id)}
            onAccion={async (fn) => {
              setOcupada(t.id);
              const r = await fn();
              setOcupada(null);
              if (!r.ok) {
                setError(r.error ?? "No se pudo.");
                return false;
              }
              setError(null);
              setAbierta(null);
              await cargar();
              return true;
            }}
          />
        ))}
      </div>

      {cerradas.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cerradas en los últimos 7 días ({cerradas.length})
          </summary>
          <div className="mt-3 space-y-2">
            {cerradas.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              >
                {t.estado === "resuelta" ? (
                  <Check size={14} className="shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                )}
                <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
                {t.nota && <span className="hidden shrink-0 italic sm:block">{t.nota}</span>}
                <span className="shrink-0">{t.resueltaEn ? cuando(t.resueltaEn) : ""}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Fila({
  tarea,
  abierta,
  ocupada,
  onAbrir,
  onAccion,
}: {
  tarea: Tarea;
  abierta: boolean;
  ocupada: boolean;
  onAbrir: () => void;
  onAccion: (fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
}) {
  const [consumo, setConsumo] = React.useState("");
  const [direccion, setDireccion] = React.useState(tarea.datos.direccion ?? "");
  const [motivo, setMotivo] = React.useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = React.useState(false);

  const urgente = tarea.tipo === "escalamiento";

  return (
    <div
      className={`rounded-xl border ${
        urgente ? "border-amber-300 bg-amber-50/50" : "border-border bg-card"
      }`}
    >
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className={`mt-0.5 shrink-0 ${urgente ? "text-amber-600" : "text-primary"}`}>
          {ICONO[tarea.tipo]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-secondary">{tarea.titulo}</span>
          {tarea.detalle && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{tarea.detalle}</span>
          )}
          <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
            {ETIQUETA_TIPO[tarea.tipo]} · {cuando(tarea.creadaEn)}
            {tarea.venceEn ? ` · vence ${new Date(tarea.venceEn).toLocaleDateString("es-CO")}` : ""}
          </span>
        </span>
      </button>

      {abierta && (
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          {/* El documento, si lo hay. Sin esto la tarea no se puede resolver:
              hay que poder mirar la factura para escribir lo que dice. */}
          {tarea.datos.archivo && (
            <a
              href={tarea.datos.archivo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <ExternalLink size={13} /> Abrir la factura que subió el prospecto
            </a>
          )}

          {tarea.datos.leido && Object.keys(tarea.datos.leido).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Ya se leyó:{" "}
              {Object.entries(tarea.datos.leido)
                .map(([k, v]) => `${k} ${v}`)
                .join(" · ")}
            </p>
          )}

          {tarea.tipo === "recibo" && !pidiendoMotivo && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-secondary">
                Consumo pico (kWh)
                <input
                  value={consumo}
                  onChange={(e) => setConsumo(e.target.value)}
                  inputMode="numeric"
                  placeholder="el mes más alto de la gráfica"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-secondary">
                Dirección
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="como aparece en la factura"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>
          )}

          {pidiendoMotivo && (
            <label className="block text-xs font-semibold text-secondary">
              ¿Por qué no se pudo?
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="la foto está cortada y no se ve la gráfica"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
              />
              <span className="mt-1 block font-normal text-muted-foreground">
                El asistente se lo pedirá al cliente durante la conversación.
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {tarea.tipo === "recibo" ? (
              pidiendoMotivo ? (
                <>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={() => void onAccion(() => cerrarSinSolucion(tarea.id, motivo))}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                  >
                    Confirmar que no se pudo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPidiendoMotivo(false)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition active:scale-95"
                  >
                    Volver
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={() =>
                      void onAccion(() =>
                        resolverTareaRecibo(tarea.id, {
                          consumoPicoKwh: consumo.trim() ? Number(consumo.replace(",", ".")) : undefined,
                          direccion: direccion.trim() || undefined,
                        }),
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                  >
                    {ocupada ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Resolver tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => setPidiendoMotivo(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition active:scale-95"
                  >
                    <X size={13} /> No se pudo resolver
                  </button>
                </>
              )
            ) : (
              <button
                type="button"
                disabled={ocupada}
                onClick={() => void onAccion(() => marcarHecha(tarea.id))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
              >
                {ocupada ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Marcar como hecha
              </button>
            )}

            {tarea.quoteId && (
              <a
                href={`/admin/leads?lead=${tarea.quoteId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition active:scale-95"
              >
                <ExternalLink size={13} /> Ver el prospecto
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
