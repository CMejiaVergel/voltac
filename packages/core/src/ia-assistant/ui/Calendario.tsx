"use client";

import * as React from "react";
import { CalendarDays, Video, MapPin, Users, Bot, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../utils";
import { cargarAgenda } from "../acciones-avanzadas";
import type { Agenda, EventoAgenda } from "../cliente";
import { SinAsistente } from "./SinAsistente";
import { Solicitudes } from "./Solicitudes";

/**
 * La agenda, dentro del módulo.
 *
 * Existe para no tener que salir a Google cada vez que hay que saber si un
 * horario está libre. Es de solo lectura a propósito: crear y cancelar citas
 * sigue siendo cosa del asistente dentro de una conversación, que es donde
 * queda el rastro de por qué se agendó y con quién.
 *
 * Los eventos se agrupan por día y se marcan los que creó el asistente. Esa
 * distinción es la que se mira de verdad: un hueco que bloqueaste tú se puede
 * mover, uno que el bot le prometió a un prospecto no.
 */

const DIAS_OPCIONES = [7, 14, 30];

function fechaLarga(iso: string, zona: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: zona,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function hora(iso: string, zona: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: zona,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function claveDia(iso: string, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export default function Calendario({ disponible }: { disponible: boolean }) {
  const [agenda, setAgenda] = React.useState<Agenda | null>(null);
  const [dias, setDias] = React.useState(14);
  const [error, setError] = React.useState("");
  const [cargando, setCargando] = React.useState(true);

  const cargar = React.useCallback(async (d: number) => {
    setCargando(true);
    const r = await cargarAgenda(d);
    setCargando(false);
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudo leer el calendario.");
      setAgenda(null);
      return;
    }
    setError("");
    setAgenda(r.datos);
  }, []);

  React.useEffect(() => {
    if (disponible) void cargar(dias);
  }, [disponible, dias, cargar]);

  if (!disponible) {
    return (
      <SinAsistente />
    );
  }

  const zona = agenda?.zonaHoraria ?? "America/Bogota";

  const porDia = new Map<string, EventoAgenda[]>();
  for (const e of agenda?.eventos ?? []) {
    const k = claveDia(e.inicio, zona);
    porDia.set(k, [...(porDia.get(k) ?? []), e]);
  }

  const hoy = claveDia(new Date().toISOString(), zona);

  return (
    <div className="space-y-4">
      {/* Arriba del calendario a proposito: son peticiones de clientes que
          estan esperando, y son lo unico de esta pantalla que exige una
          decision. La agenda se mira; esto se atiende. */}
      <Solicitudes />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {DIAS_OPCIONES.map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                dias === d ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d} días
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {agenda && (
            <span className="text-xs text-muted-foreground">
              {agenda.calendario} · {zona}
            </span>
          )}
          <button
            onClick={() => void cargar(dias)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 items-start text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {agenda && porDia.size === 0 && !cargando && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CalendarDays size={28} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay nada agendado en los próximos {dias} días.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {[...porDia.entries()].map(([dia, eventos]) => (
          <section key={dia} className="bg-card border border-border rounded-xl overflow-hidden">
            <header
              className={cn(
                "px-4 py-2.5 border-b border-border flex items-baseline gap-2",
                dia === hoy ? "bg-primary/5" : "bg-muted/30",
              )}
            >
              <h3 className="font-bold text-sm capitalize">
                {fechaLarga(eventos[0]!.inicio, zona)}
              </h3>
              {dia === hoy && (
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider">hoy</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
              </span>
            </header>

            <div className="divide-y divide-border/60">
              {eventos.map((e) => (
                <article key={e.id} className="p-4 flex gap-4">
                  <div className="shrink-0 w-20 text-right">
                    {e.todoElDia ? (
                      <span className="text-xs text-muted-foreground">todo el día</span>
                    ) : (
                      <>
                        <div className="text-sm font-bold">{hora(e.inicio, zona)}</div>
                        <div className="text-[11px] text-muted-foreground">{hora(e.fin, zona)}</div>
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{e.titulo}</h4>
                      {e.delAsistente && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          <Bot size={10} /> agendó el asistente
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {e.ubicacion && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {e.ubicacion}
                        </span>
                      )}
                      {e.asistentes.length > 0 && (
                        <span className="flex items-center gap-1" title={e.asistentes.join(", ")}>
                          <Users size={12} /> {e.asistentes.length}{" "}
                          {e.asistentes.length === 1 ? "invitado" : "invitados"}
                        </span>
                      )}
                      {e.enlace && (
                        <a
                          href={e.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Video size={12} /> Entrar a la videollamada
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Solo lectura. Las citas se crean y se cancelan dentro de la conversación, que es donde
        queda constancia de por qué se agendaron.
      </p>
    </div>
  );
}
