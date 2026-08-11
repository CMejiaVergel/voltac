"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarCheck,
  Coins,
  Info,
  Leaf,
  Ruler,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "../../utils";
import type { CalificacionProspecto } from "../calificacion";
import type { ResultadoDimensionamiento } from "../motor";

const cop = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
const num = (n: number) => n.toLocaleString("es-CO");

/** Millones, para los ejes. Un eje en pesos completos es ilegible. */
const millones = (n: number) => `${Math.round(n / 1_000_000)}M`;

const COLOR_CALIFICACION: Record<string, string> = {
  excelente: "bg-green-50 border-green-200 text-green-800",
  "muy bueno": "bg-emerald-50 border-emerald-200 text-emerald-800",
  aceptable: "bg-blue-50 border-blue-200 text-blue-800",
  largo: "bg-amber-50 border-amber-200 text-amber-900",
  "no viable": "bg-red-50 border-red-200 text-red-800",
};

const COLOR_NIVEL: Record<string, string> = {
  caliente: "bg-red-50 border-red-200 text-red-700",
  tibio: "bg-amber-50 border-amber-200 text-amber-800",
  frio: "bg-blue-50 border-blue-200 text-blue-700",
  "no-calificado": "bg-muted border-border text-muted-foreground",
};

const PALETA = ["#f97316", "#0ea5e9", "#22c55e", "#a855f7", "#eab308", "#64748b", "#ec4899"];

export function Resultado({
  r,
  calificacion,
}: {
  r: ResultadoDimensionamiento;
  calificacion?: CalificacionProspecto | null;
}) {
  return (
    <div className="space-y-5">
      <Titular r={r} />
      {r.advertencias.length > 0 && <Advertencias items={r.advertencias} />}

      <div className="grid lg:grid-cols-2 gap-5">
        <RetornoGrafica r={r} />
        <InversionGrafica r={r} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Impacto r={r} />
        <Incentivos r={r} />
      </div>

      {calificacion && <Calificacion c={calificacion} />}

      <Supuestos items={r.supuestos} />
    </div>
  );
}

/* ------------------------------------------------------------------ titular */

function Titular({ r }: { r: ResultadoDimensionamiento }) {
  const s = r.sistema;
  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <Cifra
          icono={<Sun size={16} />}
          etiqueta="Sistema"
          valor={`${s.potenciaKwp} kWp`}
          pie={`${s.numeroPaneles} paneles de ${s.panelWp} Wp`}
        />
        <Cifra
          icono={<Zap size={16} />}
          etiqueta="Genera"
          valor={`${num(s.generacionMensualKwh)} kWh`}
          pie={`al mes · cubre el ${Math.round(r.ahorro.reduccionFactura * 100)}% de la factura`}
        />
        <Cifra
          icono={<Coins size={16} />}
          etiqueta="Inversión"
          valor={cop(r.inversion.total)}
          pie={`${cop(r.inversion.costoPorWp)} por vatio${r.inversion.iva === 0 ? " · sin IVA" : ""}`}
        />
        <Cifra
          icono={<CalendarCheck size={16} />}
          etiqueta="Se paga en"
          valor={r.retorno.anios === null ? "No se paga" : `${r.retorno.anios} años`}
          pie={
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide",
                COLOR_CALIFICACION[r.retorno.calificacion],
              )}
            >
              {r.retorno.calificacion}
            </span>
          }
        />
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Ruler size={12} /> Necesita <strong className="text-secondary">{num(s.areaRequeridaM2)} m²</strong> de
          cubierta
        </span>
        <span>
          Ahorro estimado <strong className="text-secondary">{cop(r.ahorro.mensualPrimerAnio)}</strong> al mes
        </span>
        {s.bateriaKwh && (
          <span>
            Banco de baterías de <strong className="text-secondary">{s.bateriaKwh} kWh</strong>
          </span>
        )}
        <span>
          Radiación de <strong className="text-secondary">{s.hsp} HSP</strong>
        </span>
      </div>
    </section>
  );
}

function Cifra({
  icono,
  etiqueta,
  valor,
  pie,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  pie: React.ReactNode;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icono}
        {etiqueta}
      </div>
      <div className="text-2xl font-bold text-secondary mt-1.5 leading-tight">{valor}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{pie}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ retorno */

function RetornoGrafica({ r }: { r: ResultadoDimensionamiento }) {
  const datos = React.useMemo(
    () => [{ anio: 0, acumulado: -r.inversion.total }, ...r.retorno.flujoAnual],
    [r],
  );

  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <Encabezado
        titulo="Retorno de la inversión"
        nota="Dinero acumulado año a año. Donde la línea cruza el cero, el sistema ya se pagó."
      />

      <div className="h-56 mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos}>
            <defs>
              <linearGradient id="gradRetorno" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
            <XAxis dataKey="anio" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={millones} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={45} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            {r.retorno.anios !== null && (
              <ReferenceLine
                x={Math.round(r.retorno.anios)}
                stroke="#f97316"
                strokeDasharray="4 4"
                label={{ value: `${r.retorno.anios} años`, fontSize: 11, fill: "#f97316", position: "top" }}
              />
            )}
            <Tooltip
              formatter={(v) => [cop(Number(v)), "Acumulado"]}
              labelFormatter={(l) => (l === 0 ? "Al instalar" : `Año ${l}`)}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradRetorno)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <Escenario
          etiqueta="Si la tarifa no sube"
          valor={r.retorno.aniosSinEscalada}
          nota="el peor caso"
        />
        <Escenario etiqueta="Escenario base" valor={r.retorno.anios} nota="tarifa +4% al año" destacado />
        <Escenario
          etiqueta="Con beneficio tributario"
          valor={r.retorno.aniosConIncentivos}
          nota={r.incentivos.aplicaDeduccion ? "deducción de renta" : "no aplica a hogares"}
        />
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 flex gap-1.5 items-start">
        <Info size={12} className="shrink-0 mt-0.5" />
        En 25 años el sistema deja {cop(r.ahorro.acumulado25Anios)} netos, ya descontada la inversión y el
        mantenimiento.
      </p>
    </section>
  );
}

function Escenario({
  etiqueta,
  valor,
  nota,
  destacado,
}: {
  etiqueta: string;
  valor: number | null;
  nota: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        destacado ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">
        {etiqueta}
      </div>
      <div className="text-lg font-bold text-secondary mt-0.5">{valor === null ? "—" : `${valor} a`}</div>
      <div className="text-[10px] text-muted-foreground">{nota}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- inversión */

function InversionGrafica({ r }: { r: ResultadoDimensionamiento }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <Encabezado titulo="En qué se va la inversión" nota="Reparto de referencia sobre el total del sistema." />

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
        <div className="h-48 w-full sm:w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={r.inversion.desglose}
                dataKey="valor"
                nameKey="concepto"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={2}
              >
                {r.inversion.desglose.map((_, i) => (
                  <Cell key={i} fill={PALETA[i % PALETA.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => cop(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-1">
          {r.inversion.desglose.map((d, i) => (
            <div key={d.concepto} className="flex items-center gap-2 text-[12px]">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: PALETA[i % PALETA.length] }}
              />
              <span className="flex-1 text-secondary truncate">{d.concepto}</span>
              <span className="font-mono text-muted-foreground">{cop(d.valor)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-1.5 mt-1.5 space-y-1">
            <Renglon etiqueta="Subtotal" valor={cop(r.inversion.subtotal)} />
            <Renglon
              etiqueta={r.inversion.iva === 0 ? "IVA (excluido por Ley 1715)" : "IVA 19%"}
              valor={r.inversion.iva === 0 ? "$0" : cop(r.inversion.iva)}
              verde={r.inversion.iva === 0}
            />
            <Renglon etiqueta="Total" valor={cop(r.inversion.total)} fuerte />
          </div>
        </div>
      </div>
    </section>
  );
}

function Renglon({
  etiqueta,
  valor,
  fuerte,
  verde,
}: {
  etiqueta: string;
  valor: string;
  fuerte?: boolean;
  verde?: boolean;
}) {
  return (
    <div className={cn("flex justify-between text-[12px]", fuerte && "font-bold text-secondary text-sm")}>
      <span className={cn(verde ? "text-green-700" : fuerte ? "" : "text-muted-foreground")}>{etiqueta}</span>
      <span className={cn("font-mono", verde && "text-green-700")}>{valor}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- impacto */

function Impacto({ r }: { r: ResultadoDimensionamiento }) {
  const i = r.impacto;
  // La curva de CO2 acumulado convence más que el número anual suelto: 4
  // toneladas al año no le dicen nada a nadie, 105 en la vida del sistema sí.
  const datos = React.useMemo(() => {
    let acc = 0;
    return r.retorno.flujoAnual.map((f, n) => {
      acc += (r.sistema.generacionAnualKwh * (1 - 0.005) ** n * 0.225) / 1000;
      return { anio: f.anio, co2: Math.round(acc * 10) / 10 };
    });
  }, [r]);

  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <Encabezado titulo="Impacto ambiental y social" nota="Emisiones que se dejan de generar en la red." />

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Mini icono={<Leaf size={14} />} valor={`${i.co2EvitadoTonAnio} t`} etiqueta="CO₂ al año" />
        <Mini icono={<Leaf size={14} />} valor={num(i.arbolesEquivalentes)} etiqueta="árboles equivalentes" />
        <Mini icono={<Users size={14} />} valor={String(i.hogaresEquivalentes)} etiqueta="hogares alimentados" />
      </div>

      <div className="h-32 mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
            <XAxis dataKey="anio" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              formatter={(v) => [`${v} t CO₂`, "Acumulado"]}
              labelFormatter={(l) => `Año ${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="co2" fill="#22c55e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{i.notaSocial}</p>
    </section>
  );
}

function Mini({ icono, valor, etiqueta }: { icono: React.ReactNode; valor: string; etiqueta: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
      <div className="flex justify-center text-green-600">{icono}</div>
      <div className="text-lg font-bold text-secondary mt-0.5 leading-none">{valor}</div>
      <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{etiqueta}</div>
    </div>
  );
}

/* -------------------------------------------------------------- incentivos */

function Incentivos({ r }: { r: ResultadoDimensionamiento }) {
  const i = r.incentivos;
  const total = i.ahorroTributarioEstimado + i.ahorroPorExclusionIva;

  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <Encabezado
        titulo="Beneficios tributarios"
        nota="Ley 1715 de 2014, modificada por la Ley 2099 de 2021."
      />

      {total > 0 && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-green-700">
            Beneficio estimado
          </div>
          <div className="text-2xl font-bold text-green-800 leading-tight mt-0.5">{cop(total)}</div>
          <div className="text-[11px] text-green-700 mt-1">
            {i.ahorroPorExclusionIva > 0 && `${cop(i.ahorroPorExclusionIva)} de IVA excluido`}
            {i.ahorroTributarioEstimado > 0 &&
              `${i.ahorroPorExclusionIva > 0 ? " + " : ""}${cop(i.ahorroTributarioEstimado)} de menor renta`}
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {i.notas.map((n, k) => (
          <li key={k} className="flex gap-2 text-[12px] text-muted-foreground leading-relaxed">
            <span className="text-primary mt-1.5 shrink-0 w-1 h-1 rounded-full bg-primary" />
            {n}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ calificación */

function Calificacion({ c }: { c: CalificacionProspecto }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Encabezado
          titulo="Calificación del prospecto"
          nota="Si la persona está en posición de hacer la inversión. Es distinto de si el proyecto es buen negocio."
        />
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide",
              COLOR_NIVEL[c.nivel],
            )}
          >
            {c.nivel.replace("-", " ")}
          </span>
          <span className="text-2xl font-bold text-secondary">{c.puntaje}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {c.factores.map((f) => (
          <div key={f.factor}>
            <div className="flex justify-between text-[12px]">
              <span className="font-semibold text-secondary">{f.factor}</span>
              <span className="font-mono text-muted-foreground">
                {f.puntos}
                {f.de > 0 && ` / ${f.de}`}
              </span>
            </div>
            {f.de > 0 && (
              <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(0, (f.puntos / f.de) * 100)}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">{f.nota}</p>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 rounded-lg border p-3 text-[12px] leading-relaxed",
          c.ofrecerReunion
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-muted/40 border-border text-secondary",
        )}
      >
        <div className="font-bold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
          <TrendingUp size={12} />
          {c.ofrecerReunion ? "Ofrecer reunión" : "Todavía no ofrecer reunión"}
        </div>
        {c.recomendacion}
      </div>

      {c.faltaPorSaber.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Falta por preguntar
          </div>
          <ul className="space-y-1">
            {c.faltaPorSaber.map((f, k) => (
              <li key={k} className="text-[12px] text-muted-foreground flex gap-2">
                <span className="text-primary">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- auxiliares */

function Advertencias({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((a, i) => (
        <div
          key={i}
          className="flex gap-2 items-start text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed"
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          {a}
        </div>
      ))}
    </div>
  );
}

function Supuestos({ items }: { items: string[] }) {
  const [abierto, setAbierto] = React.useState(false);
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Supuestos del cálculo</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Todo lo que se dio por hecho para llegar a estas cifras. Nada de esto puede quedar implícito frente a
            un cliente.
          </p>
        </div>
        <span className="text-xs font-semibold text-primary shrink-0 ml-4">
          {abierto ? "Ocultar" : `Ver los ${items.length}`}
        </span>
      </button>

      {abierto && (
        <ul className="mt-3 space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className="text-[12px] text-muted-foreground flex gap-2 leading-relaxed">
              <span className="text-primary shrink-0">·</span>
              {s}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-secondary">Este es un estimado, no una cotización.</strong> El valor final depende
        de la inspección del sitio: estado de la cubierta, distancia al tablero, sombras, nivel de tensión y
        trámite ante el operador de red. Para un número en firme hace falta el estudio de viabilidad.
      </p>
    </section>
  );
}

function Encabezado({ titulo, nota }: { titulo: string; nota: string }) {
  return (
    <div>
      <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">{titulo}</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">{nota}</p>
    </div>
  );
}
