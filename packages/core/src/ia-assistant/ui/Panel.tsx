"use client";

import * as React from "react";
import Link from "next/link";
import {
  Power,
  Inbox,
  UserPlus,
  UserCheck,
  CalendarCheck,
  Coins,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { cn } from "../../utils";
import { cargarEstado } from "../acciones-bandeja";
import { cargarMetricas } from "../acciones-avanzadas";
import type { EstadoAsistente, Metricas } from "../cliente";

/**
 * Panel general del asistente.
 *
 * Responde a una sola pregunta: **¿hay algo que atender ahora?** Por eso lo
 * primero no son las cifras acumuladas sino lo que está esperando a alguien —un
 * prospecto sin respuesta, un caso escalado, leads en cola— y cada cosa lleva
 * su enlace a donde se resuelve.
 *
 * Los totales del mes van después, porque casi nunca cambian una decisión de
 * hoy. La excepción es el saldo: quedarse sin crédito deja al asistente mudo
 * frente a clientes reales, así que se avisa antes de que ocurra.
 */

const usd = (n: number) => (n >= 1 ? `USD ${n.toFixed(2)}` : `USD ${n.toFixed(4)}`);

function Pendiente({
  icono,
  cantidad,
  texto,
  href,
  urgente,
}: {
  icono: React.ReactNode;
  cantidad: number;
  texto: string;
  href: string;
  urgente?: boolean;
}) {
  const hay = cantidad > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors group",
        !hay
          ? "bg-card border-border opacity-60"
          : urgente
            ? "bg-amber-50 border-amber-300 hover:border-amber-400"
            : "bg-card border-border hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "shrink-0 w-11 h-11 rounded-xl grid place-items-center",
          hay && urgente ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
        )}
      >
        {icono}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-black leading-none">{cantidad}</div>
        <p className="text-xs text-muted-foreground mt-1">{texto}</p>
      </div>
      {hay && (
        <ArrowRight
          size={16}
          className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
        />
      )}
    </Link>
  );
}

export default function Panel({ disponible }: { disponible: boolean }) {
  const [estado, setEstado] = React.useState<EstadoAsistente | null>(null);
  const [metricas, setMetricas] = React.useState<Metricas | null>(null);
  const [error, setError] = React.useState("");
  const [cargando, setCargando] = React.useState(true);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    const [e, m] = await Promise.all([cargarEstado(), cargarMetricas(30)]);
    setCargando(false);
    if (!e.ok) {
      setError(e.error ?? "No se pudo leer el estado.");
      return;
    }
    setError("");
    setEstado(e.datos ?? null);
    if (m.ok) setMetricas(m.datos ?? null);
  }, []);

  React.useEffect(() => {
    if (!disponible) {
      setCargando(false);
      return;
    }
    void cargar();
    // Un panel abierto en una pantalla debe reflejar lo que pasa sin que nadie
    // lo recargue. Medio minuto basta: aquí no se leen mensajes uno a uno.
    const id = setInterval(() => {
      if (!document.hidden) void cargar();
    }, 30_000);
    return () => clearInterval(id);
  }, [disponible, cargar]);

  if (!disponible) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <h2 className="text-lg font-bold mb-2">Esta línea todavía no tiene asistente</h2>
        <p className="text-sm text-muted-foreground">
          Cuando esté configurada, aquí verás su estado de un vistazo.
        </p>
      </div>
    );
  }

  if (!estado) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-sm text-muted-foreground">
        {error || "Cargando…"}
      </div>
    );
  }

  const costoDiario =
    metricas && metricas.porDia.length ? metricas.costoUsd / metricas.porDia.length : 0;
  const diasDeSaldo =
    metricas?.saldoUsd !== undefined && costoDiario > 0
      ? Math.floor(metricas.saldoUsd / costoDiario)
      : null;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado del canal */}
      <section
        className={cn(
          "border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap",
          estado.pausado ? "bg-red-50 border-red-200" : "bg-card border-border",
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl grid place-items-center",
              estado.pausado ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700",
            )}
          >
            <Power size={22} />
          </div>
          <div>
            <h2 className="font-bold">
              {estado.pausado ? "El asistente está en pausa" : "El asistente está atendiendo"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
              <span>canal {estado.canal}</span>
              <span className="flex items-center gap-1">
                <Cpu size={11} /> {estado.modelo}
              </span>
              <span>{estado.activas} conversación(es) con movimiento hoy</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/ia-assistant/configuracion"
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:border-primary/40 transition-colors"
          >
            Configurar
          </Link>
          <button
            onClick={() => void cargar()}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {/* Lo que espera a alguien */}
      <section>
        <h3 className="font-bold uppercase tracking-wider text-sm text-secondary mb-3">
          Qué está esperando
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Pendiente
            icono={<Inbox size={20} />}
            cantidad={estado.esperandoRespuesta}
            texto="escribieron y nadie ha contestado"
            href="/admin/ia-assistant"
            urgente
          />
          <Pendiente
            icono={<UserCheck size={20} />}
            cantidad={estado.escalados + estado.enManosDeUnaPersona}
            texto="conversaciones que llevas tú, no el asistente"
            href="/admin/ia-assistant"
            urgente
          />
          <Pendiente
            icono={<UserPlus size={20} />}
            cantidad={estado.leadsEnCola}
            texto="leads sin contactar todavía"
            href="/admin/leads"
          />
          <Pendiente
            icono={<CalendarCheck size={20} />}
            cantidad={estado.reunionesAgendadas}
            texto="prospectos con reunión agendada"
            href="/admin/ia-assistant/calendario"
          />
        </div>
      </section>

      {/* Consumo */}
      {metricas && (
        <section>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary mb-3">
            Últimos 30 días
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-black">{usd(metricas.costoUsd)}</div>
              <p className="text-xs text-muted-foreground mt-1">gastado en respuestas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-black">{metricas.turnos}</div>
              <p className="text-xs text-muted-foreground mt-1">respuestas del asistente</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-black">{metricas.citasAgendadas}</div>
              <p className="text-xs text-muted-foreground mt-1">reuniones que agendó solo</p>
            </div>
            <div
              className={cn(
                "border rounded-xl p-4",
                diasDeSaldo !== null && diasDeSaldo < 14
                  ? "bg-amber-50 border-amber-300"
                  : "bg-card border-border",
              )}
            >
              <div className="text-2xl font-black flex items-center gap-1.5">
                <Coins size={18} className="text-muted-foreground" />
                {metricas.saldoUsd !== undefined ? usd(metricas.saldoUsd) : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {diasDeSaldo !== null
                  ? `alcanza ~${diasDeSaldo} día(s) a este ritmo`
                  : "saldo restante"}
              </p>
            </div>
          </div>

          {diasDeSaldo !== null && diasDeSaldo < 14 && (
            <p className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Al ritmo actual el saldo se agota en unos {diasDeSaldo} días. Cuando se acabe, el
                asistente deja de responder a clientes reales: recarga en OpenRouter antes.
              </span>
            </p>
          )}

          <p className="text-right mt-3">
            <Link
              href="/admin/ia-assistant/actividad"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver el detalle de consumo →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
