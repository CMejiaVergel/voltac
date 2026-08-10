"use client";

import * as React from "react";
import {
  Coins,
  MessageSquare,
  Clock,
  AlertTriangle,
  CalendarCheck,
  UserCheck,
  Wrench,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../utils";
import { cargarMetricas } from "../acciones-avanzadas";
import type { Metricas } from "../cliente";

/**
 * Consumo y costo del asistente.
 *
 * Sale entero de la auditoría: cada turno ya registra sus tokens, su costo y
 * las herramientas que usó. No hay contadores aparte, que es lo que evita tener
 * dos números que no cuadran y ninguno de confianza.
 *
 * Lo que de verdad decide está en "las conversaciones más caras": está medido
 * que un turno pasa de tres a doce milésimas de dólar a medida que la
 * conversación crece, porque cada vez se reenvía más historial. Una sola
 * conversación larga puede costar más que veinte cortas, y sin verlo eso no se
 * descubre hasta que se acaba el saldo.
 */

const PERIODOS = [7, 30, 90];

const usd = (n: number) =>
  n >= 1 ? `USD ${n.toFixed(2)}` : `USD ${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;

const miles = (n: number) => new Intl.NumberFormat("es-CO").format(n);

function Tarjeta({
  icono,
  valor,
  etiqueta,
  detalle,
  alerta,
}: {
  icono: React.ReactNode;
  valor: string;
  etiqueta: string;
  detalle?: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={cn(
        "border rounded-xl p-4",
        alerta ? "bg-amber-50 border-amber-200" : "bg-card border-border",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icono}
        <span className="text-[10px] font-bold uppercase tracking-wider">{etiqueta}</span>
      </div>
      <div className="text-2xl font-black tracking-tight">{valor}</div>
      {detalle && <p className="text-[11px] text-muted-foreground mt-1">{detalle}</p>}
    </div>
  );
}

export default function Actividad({ disponible }: { disponible: boolean }) {
  const [m, setM] = React.useState<Metricas | null>(null);
  const [dias, setDias] = React.useState(30);
  const [error, setError] = React.useState("");
  const [cargando, setCargando] = React.useState(true);

  const cargar = React.useCallback(async (d: number) => {
    setCargando(true);
    const r = await cargarMetricas(d);
    setCargando(false);
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudieron leer las métricas.");
      return;
    }
    setError("");
    setM(r.datos);
  }, []);

  React.useEffect(() => {
    if (disponible) void cargar(dias);
  }, [disponible, dias, cargar]);

  if (!disponible) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <h2 className="text-lg font-bold mb-2">Esta línea todavía no tiene asistente</h2>
        <p className="text-sm text-muted-foreground">Cuando esté configurada, aquí verás su consumo.</p>
      </div>
    );
  }

  if (!m) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-sm text-muted-foreground">
        {error || "Cargando métricas…"}
      </div>
    );
  }

  const maxDia = Math.max(...m.porDia.map((d) => d.costoUsd), 0.0001);
  // Con el consumo del periodo se estima cuánto dura lo que queda. Es una
  // proyección tosca a propósito: sirve para saber si hay que recargar esta
  // semana o el mes que viene, no para presupuestar.
  const costoDiario = m.porDia.length ? m.costoUsd / m.porDia.length : 0;
  const diasDeSaldo = m.saldoUsd && costoDiario > 0 ? Math.floor(m.saldoUsd / costoDiario) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODOS.map((d) => (
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
        <button
          onClick={() => void cargar(dias)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tarjeta
          icono={<Coins size={14} />}
          valor={usd(m.costoUsd)}
          etiqueta="Costo del periodo"
          detalle={`${usd(m.costoPorTurno)} por respuesta`}
        />
        <Tarjeta
          icono={<MessageSquare size={14} />}
          valor={miles(m.turnos)}
          etiqueta="Respuestas"
          detalle={`en ${m.conversaciones} conversación(es)`}
        />
        <Tarjeta
          icono={<Wrench size={14} />}
          valor={miles(m.tokens)}
          etiqueta="Tokens"
          detalle={m.turnos ? `${miles(Math.round(m.tokens / m.turnos))} por respuesta` : undefined}
        />
        <Tarjeta
          icono={<Wallet size={14} />}
          valor={m.saldoUsd !== undefined ? usd(m.saldoUsd) : "—"}
          etiqueta="Saldo restante"
          detalle={
            diasDeSaldo !== null
              ? `alcanza ~${diasDeSaldo} día(s) a este ritmo`
              : "no se pudo consultar"
          }
          alerta={diasDeSaldo !== null && diasDeSaldo < 14}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tarjeta
          icono={<Clock size={14} />}
          valor={`${(m.msPromedio / 1000).toFixed(1)} s`}
          etiqueta="Tarda en responder"
          detalle={`el peor caso, ${(m.msMaximo / 1000).toFixed(1)} s`}
        />
        <Tarjeta
          icono={<CalendarCheck size={14} />}
          valor={String(m.citasAgendadas)}
          etiqueta="Reuniones agendadas"
          detalle={`${m.leadsContactados} lead(s) contactados`}
        />
        <Tarjeta
          icono={<UserCheck size={14} />}
          valor={String(m.escalamientos)}
          etiqueta="Pasó a una persona"
          detalle={`${m.respuestasHumanas} respuesta(s) tuyas`}
        />
        <Tarjeta
          icono={<AlertTriangle size={14} />}
          valor={String(m.errores)}
          etiqueta="Fallos técnicos"
          detalle={m.errores > 0 ? "revisa saldo y conexión" : "ninguno"}
          alerta={m.errores > 0}
        />
      </div>

      {m.porDia.length > 0 && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary mb-4">
            Gasto por día
          </h3>
          <div className="flex items-end gap-1 h-32">
            {m.porDia.map((d) => (
              <div
                key={d.dia}
                className="flex-1 flex flex-col items-center justify-end gap-1 group relative min-w-0"
              >
                <div
                  className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors min-h-[2px]"
                  style={{ height: `${(d.costoUsd / maxDia) * 100}%` }}
                />
                <span className="absolute -top-7 bg-secondary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {d.dia.slice(5)} · {usd(d.costoUsd)} · {d.turnos} resp.
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>{m.porDia[0]?.dia.slice(5)}</span>
            <span>{m.porDia[m.porDia.length - 1]?.dia.slice(5)}</span>
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {m.masCaras.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold uppercase tracking-wider text-sm text-secondary mb-1">
              Conversaciones más caras
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              El costo por respuesta sube a medida que la conversación crece: cada turno reenvía
              todo lo anterior.
            </p>
            <div className="space-y-2">
              {m.masCaras.map((c) => (
                <div key={c.conversationId} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs truncate flex-1">{c.conversationId}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{c.turnos} resp.</span>
                  <span className="font-semibold text-xs shrink-0 w-20 text-right">
                    {usd(c.costoUsd)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {m.herramientas.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold uppercase tracking-wider text-sm text-secondary mb-3">
              Herramientas usadas
            </h3>
            <div className="space-y-2">
              {m.herramientas.map((h) => (
                <div key={h.nombre} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-xs flex-1 truncate">{h.nombre}</span>
                  <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{
                        width: `${(h.veces / (m.herramientas[0]?.veces ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{h.veces}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Sale del registro de auditoría del asistente, que conserva los últimos 5.000 eventos.
        Periodos largos pueden quedar incompletos.
      </p>
    </div>
  );
}
