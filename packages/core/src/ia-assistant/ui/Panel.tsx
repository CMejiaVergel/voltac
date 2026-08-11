"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
 * Panel general del asistente. Es la portada del módulo.
 *
 * Está ordenado para responder **¿hay algo que atender ahora?** antes que
 * cualquier otra cosa. Primero el estado del canal, después lo que espera a
 * alguien —con su enlace a donde se resuelve—, y solo entonces las gráficas.
 *
 * Sobre las gráficas: cada una responde a una pregunta concreta, no están para
 * llenar. Si una no cambiaría ninguna decisión, sobra.
 *
 *  - Actividad y costo por día → ¿esto se está disparando?
 *  - Horas de mayor actividad  → ¿cuándo conviene estar disponible?
 *  - Embudo                    → ¿dónde se cae la gente?
 *  - Reparto de acciones       → ¿en qué se le va el tiempo al asistente?
 */

const usd = (n: number) => (n >= 1 ? `USD ${n.toFixed(2)}` : `USD ${n.toFixed(4)}`);

/* Los colores salen de las variables del tema para que funcionen igual en claro
   y en oscuro, y para que las dos marcas se vean cada una con lo suyo. */
const COLORES = ["var(--color-primary)", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const NOMBRE_EVENTO: Record<string, string> = {
  turno_completado: "Respondió",
  lead_contactado: "Contactó un lead",
  cita_agendada: "Agendó",
  cita_cancelada: "Canceló una cita",
  handoff: "Pasó a una persona",
  respuesta_humana: "Respondiste tú",
  documento_enviado: "Envió documento",
  correo_enviado: "Envió correo",
  error_turno: "Falló",
  respuesta_bloqueada: "No respondió (regla)",
  contact_updated: "Guardó datos",
};

function Caja({
  titulo,
  pregunta,
  children,
  ancho,
}: {
  titulo: string;
  pregunta: string;
  children: React.ReactNode;
  ancho?: string;
}) {
  return (
    <section className={cn("bg-card border border-border rounded-xl p-5", ancho)}>
      <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">{titulo}</h3>
      <p className="text-[11px] text-muted-foreground mb-4 mt-0.5">{pregunta}</p>
      {children}
    </section>
  );
}

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
        "flex items-center gap-4 p-4 rounded-xl border transition-all group",
        !hay
          ? "bg-card border-border opacity-60"
          : urgente
            ? "bg-amber-50 border-amber-300 hover:border-amber-400 hover:shadow-sm"
            : "bg-card border-border hover:border-primary/40 hover:shadow-sm",
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

/** Recuadro flotante común a todas las gráficas. */
const CAJA_TOOLTIP = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "0.75rem",
    fontSize: "12px",
  },
} as const;

export default function Panel({ disponible }: { disponible: boolean }) {
  const [estado, setEstado] = React.useState<EstadoAsistente | null>(null);
  const [metricas, setMetricas] = React.useState<Metricas | null>(null);
  const [dias, setDias] = React.useState(30);
  const [error, setError] = React.useState("");
  const [cargando, setCargando] = React.useState(true);

  const cargar = React.useCallback(async (d: number) => {
    setCargando(true);
    const [e, m] = await Promise.all([cargarEstado(), cargarMetricas(d)]);
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
    void cargar(dias);
    // Un panel abierto en una pantalla debe reflejar lo que pasa sin que nadie
    // lo recargue. Medio minuto basta: aquí no se leen mensajes uno a uno.
    const id = setInterval(() => {
      if (!document.hidden) void cargar(dias);
    }, 30_000);
    return () => clearInterval(id);
  }, [disponible, dias, cargar]);

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

  const hayDatos = Boolean(metricas && metricas.turnos > 0);

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
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
                  dias === d ? "bg-card shadow-sm text-primary" : "text-muted-foreground",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <Link
            href="/admin/ia-assistant/configuracion"
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:border-primary/40 transition-colors"
          >
            Configurar
          </Link>
          <button
            onClick={() => void cargar(dias)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {/* Lo que espera a alguien */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Pendiente
          icono={<Inbox size={20} />}
          cantidad={estado.esperandoRespuesta}
          texto="escribieron y nadie ha contestado"
          href="/admin/ia-assistant/conversaciones"
          urgente
        />
        <Pendiente
          icono={<UserCheck size={20} />}
          cantidad={estado.escalados + estado.enManosDeUnaPersona}
          texto="conversaciones que lleva una persona"
          href="/admin/ia-assistant/conversaciones"
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

      {!hayDatos ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay actividad en los últimos {dias} días. Las gráficas aparecen en cuanto el
            asistente empiece a responder.
          </p>
        </div>
      ) : (
        metricas && (
          <>
            {/* Actividad y costo */}
            <Caja
              titulo="Actividad y costo por día"
              pregunta="¿Está creciendo el uso? ¿Se está disparando el gasto?"
            >
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={metricas.porDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    dataKey="dia"
                    tickFormatter={(d: string) => d.slice(5)}
                    tick={{ fontSize: 10 }}
                    stroke="rgba(128,128,128,0.5)"
                  />
                  <YAxis yAxisId="izq" tick={{ fontSize: 10 }} stroke="rgba(128,128,128,0.5)" />
                  <YAxis
                    yAxisId="der"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    stroke="rgba(128,128,128,0.5)"
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    {...CAJA_TOOLTIP}
                    formatter={(v, n) =>
                      n === "Costo"
                        ? usd(Number(v))
                        : new Intl.NumberFormat("es-CO").format(Number(v))
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    yAxisId="izq"
                    dataKey="turnos"
                    name="Respuestas"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    yAxisId="izq"
                    dataKey="citas"
                    name="Reuniones"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="der"
                    type="monotone"
                    dataKey="costoUsd"
                    name="Costo"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Caja>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Horas */}
              <Caja
                titulo="A qué hora escriben"
                pregunta="¿Cuándo conviene estar disponible para tomar el control?"
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metricas.porHora}>
                    <defs>
                      <linearGradient id="gradHoras" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                      dataKey="hora"
                      tickFormatter={(h: number) => `${h}h`}
                      tick={{ fontSize: 10 }}
                      stroke="rgba(128,128,128,0.5)"
                      interval={2}
                    />
                    <YAxis tick={{ fontSize: 10 }} stroke="rgba(128,128,128,0.5)" allowDecimals={false} />
                    <Tooltip
                      {...CAJA_TOOLTIP}
                      labelFormatter={(h) => `Entre las ${Number(h)}:00 y las ${Number(h) + 1}:00`}
                      formatter={(v) => `${v} mensajes`}
                    />
                    <Area
                      type="monotone"
                      dataKey="mensajes"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#gradHoras)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Caja>

              {/* Embudo */}
              <Caja
                titulo="Embudo"
                pregunta="De las conversaciones atendidas, ¿cuántas llegan a agendar?"
              >
                <ResponsiveContainer width="100%" height={200}>
                  <FunnelChart>
                    <Tooltip {...CAJA_TOOLTIP} />
                    <Funnel dataKey="cantidad" data={metricas.embudo} isAnimationActive>
                      {metricas.embudo.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                      <LabelList
                        position="right"
                        fill="var(--color-foreground)"
                        stroke="none"
                        dataKey="etapa"
                        fontSize={12}
                      />
                      <LabelList
                        position="left"
                        fill="var(--color-foreground)"
                        stroke="none"
                        dataKey="cantidad"
                        fontSize={13}
                        fontWeight="bold"
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
                {metricas.embudo[0]!.cantidad > 0 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    De cada 100 conversaciones,{" "}
                    {Math.round((metricas.embudo[2]!.cantidad / metricas.embudo[0]!.cantidad) * 100)}{" "}
                    terminan en reunión agendada.
                  </p>
                )}
              </Caja>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Reparto de acciones */}
              <Caja titulo="En qué se le va el tiempo" pregunta="¿Qué está haciendo el asistente?">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={metricas.reparto.slice(0, 6).map((r) => ({
                        ...r,
                        nombre: NOMBRE_EVENTO[r.tipo] ?? r.tipo,
                      }))}
                      dataKey="veces"
                      nameKey="nombre"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {metricas.reparto.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CAJA_TOOLTIP} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Caja>

              {/* Herramientas */}
              <Caja
                titulo="Herramientas que usa"
                pregunta="¿Está agendando y consultando, o solo conversando?"
              >
                {metricas.herramientas.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    Todavía no ha usado ninguna herramienta.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={metricas.herramientas.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="rgba(128,128,128,0.5)" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        tick={{ fontSize: 10 }}
                        stroke="rgba(128,128,128,0.5)"
                        width={130}
                      />
                      <Tooltip {...CAJA_TOOLTIP} formatter={(v) => `${v} veces`} />
                      <Bar dataKey="veces" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {metricas.herramientas.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Caja>
            </div>

            {/* Saldo */}
            <section
              className={cn(
                "border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap",
                diasDeSaldo !== null && diasDeSaldo < 14
                  ? "bg-amber-50 border-amber-300"
                  : "bg-card border-border",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl grid place-items-center bg-muted text-muted-foreground">
                  <Coins size={22} />
                </div>
                <div>
                  <div className="text-2xl font-black leading-none">
                    {metricas.saldoUsd !== undefined ? usd(metricas.saldoUsd) : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {diasDeSaldo !== null
                      ? `de saldo: alcanza unos ${diasDeSaldo} día(s) al ritmo actual`
                      : "saldo restante en OpenRouter"}
                    {" · "}
                    {usd(metricas.costoUsd)} gastados en {dias} días
                  </p>
                </div>
              </div>
              <Link
                href="/admin/ia-assistant/actividad"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ver el detalle →
              </Link>
            </section>

            {diasDeSaldo !== null && diasDeSaldo < 14 && (
              <p className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Cuando el saldo se acabe, el asistente deja de responder a clientes reales.
                  Recarga en OpenRouter antes de que ocurra.
                </span>
              </p>
            )}
          </>
        )
      )}
    </div>
  );
}
