"use client";

import * as React from "react";
import { Calculator, Loader2, Save, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "../../utils";
import { calcular, guardarEstudio } from "../acciones";
import type { CalificacionProspecto } from "../calificacion";
import { MODALIDADES, REGIONES, TIPOS_TECHO } from "../datos";
import type { EntradaDimensionamiento, ResultadoDimensionamiento } from "../motor";
import { Campo, entradaClase } from "./Campo";
import { Resultado } from "./Resultado";

interface Lead {
  id: number;
  nombre: string;
  empresa: string | null;
  /** Lo que declaró en el formulario de cotización, si lo declaró. */
  consumoKwh: number | null;
}

const INICIAL: EntradaDimensionamiento = {
  consumoMensualKwh: 0,
  precioKwh: 0,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "teja-metalica",
  tipoCliente: "residencial",
  cubrimiento: 1,
};

export function Calculadora({ leads }: { leads: Lead[] }) {
  const [entrada, setEntrada] = React.useState<EntradaDimensionamiento>(INICIAL);
  const [senales, setSenales] = React.useState({
    esPropietario: undefined as boolean | undefined,
    preguntoFinanciacion: false,
    pidioCotizacion: false,
    cuandoLoHaria: undefined as "ya" | "este-ano" | "explorando" | undefined,
  });
  const [leadId, setLeadId] = React.useState<number | null>(null);

  const [resultado, setResultado] = React.useState<ResultadoDimensionamiento | null>(null);
  const [calificacion, setCalificacion] = React.useState<CalificacionProspecto | null>(null);
  const [calculando, setCalculando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);

  const set = <K extends keyof EntradaDimensionamiento>(k: K, v: EntradaDimensionamiento[K]) => {
    setEntrada((e) => ({ ...e, [k]: v }));
    // El resultado en pantalla dejaría de corresponder a lo que dice el
    // formulario. Verlo desaparecer al tocar un campo es incómodo, pero mucho
    // menos que copiar una cifra que ya no es la de estos datos.
    setResultado(null);
    setCalificacion(null);
  };

  const modalidad = MODALIDADES.find((m) => m.id === entrada.modalidad)!;
  const listo = entrada.consumoMensualKwh > 0 && entrada.precioKwh > 0;

  async function onCalcular() {
    setCalculando(true);
    setError(null);
    setAviso(null);
    const r = await calcular(entrada, senales);
    setCalculando(false);
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudo calcular.");
      return;
    }
    setResultado(r.datos.resultado);
    setCalificacion(r.datos.calificacion);
  }

  async function onGuardar() {
    setGuardando(true);
    setError(null);
    const r = await guardarEstudio({ entrada, senales, leadId });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo guardar.");
      return;
    }
    setAviso(
      leadId
        ? "Estudio guardado y asociado al prospecto. El asistente ya lo puede consultar."
        : "Estudio guardado.",
    );
  }

  function onLimpiar() {
    setEntrada(INICIAL);
    setResultado(null);
    setCalificacion(null);
    setLeadId(null);
    setError(null);
    setAviso(null);
    setSenales({
      esPropietario: undefined,
      preguntoFinanciacion: false,
      pidioCotizacion: false,
      cuandoLoHaria: undefined,
    });
  }

  return (
    <div className="space-y-5 pb-16">
      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {aviso && (
        <div className="flex gap-2 items-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 size={16} className="shrink-0" />
          {aviso}
        </div>
      )}

      {/* --- Datos de la factura ------------------------------------------ */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Datos de la factura</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Los dos primeros son los que importan. Cada uno trae la ayuda de dónde encontrarlo, con el nombre que
            le da cada operador.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Campo campo="consumoMensualKwh" etiqueta="Consumo mensual promedio" sufijo="kWh">
            <input
              type="number"
              min={1}
              value={entrada.consumoMensualKwh || ""}
              onChange={(e) => set("consumoMensualKwh", Number(e.target.value))}
              placeholder="Ej. 450"
              className={cn(entradaClase, "pr-14")}
            />
          </Campo>

          <Campo campo="precioKwh" etiqueta="Costo unitario del kWh" sufijo="COP">
            <input
              type="number"
              min={1}
              value={entrada.precioKwh || ""}
              onChange={(e) => set("precioKwh", Number(e.target.value))}
              placeholder="Ej. 950"
              className={cn(entradaClase, "pr-14")}
            />
          </Campo>

          <Campo campo="tipoCliente" etiqueta="Tipo de cliente">
            <select
              value={entrada.tipoCliente}
              onChange={(e) => set("tipoCliente", e.target.value as EntradaDimensionamiento["tipoCliente"])}
              className={entradaClase}
            >
              <option value="residencial">Residencial (hogar)</option>
              <option value="comercial">Comercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </Campo>

          <Campo campo="region" etiqueta="Región de la instalación">
            <select value={entrada.region} onChange={(e) => set("region", e.target.value)} className={entradaClase}>
              {REGIONES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.hsp} HSP
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <p className="text-[11px] text-muted-foreground -mt-1">
          {REGIONES.find((r) => r.id === entrada.region)?.cubre}
        </p>
      </section>

      {/* --- Sistema ------------------------------------------------------- */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">El sistema</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Qué tipo de instalación y sobre qué se monta.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {MODALIDADES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => set("modalidad", m.id)}
              className={cn(
                "text-left rounded-lg border p-3 transition-colors",
                entrada.modalidad === m.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="font-bold text-sm text-secondary">{m.nombre}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Rendimiento {Math.round(m.pr * 100)}%
                {m.requiereBaterias && " · con baterías"}
              </div>
            </button>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
          {modalidad.descripcion}
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          <Campo campo="tipoTecho" etiqueta="Tipo de cubierta">
            <select
              value={entrada.tipoTecho}
              onChange={(e) => set("tipoTecho", e.target.value)}
              className={entradaClase}
            >
              {TIPOS_TECHO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo campo="areaDisponibleM2" etiqueta="Área disponible (opcional)" sufijo="m²">
            <input
              type="number"
              min={0}
              value={entrada.areaDisponibleM2 ?? ""}
              onChange={(e) => set("areaDisponibleM2", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Si se conoce"
              className={cn(entradaClase, "pr-12")}
            />
          </Campo>

          <Campo etiqueta={`Cubrir el ${Math.round((entrada.cubrimiento ?? 1) * 100)}% del consumo`}>
            <input
              type="range"
              min={30}
              max={120}
              step={5}
              value={(entrada.cubrimiento ?? 1) * 100}
              onChange={(e) => set("cubrimiento", Number(e.target.value) / 100)}
              className="w-full accent-primary"
            />
          </Campo>
        </div>

        {modalidad.requiereBaterias && (
          <div className="grid md:grid-cols-3 gap-5">
            <Campo etiqueta="Horas de autonomía" sufijo="h">
              <input
                type="number"
                min={1}
                max={72}
                value={entrada.autonomiaHoras ?? (entrada.modalidad === "aislado" ? 24 : 8)}
                onChange={(e) => set("autonomiaHoras", Number(e.target.value))}
                className={cn(entradaClase, "pr-8")}
              />
            </Campo>
            <p className="md:col-span-2 text-[11px] text-muted-foreground self-end pb-2">
              Cuánto debe aguantar el sistema sin sol. Es lo que dimensiona el banco de baterías, y las baterías
              son el renglón más caro de todos.
            </p>
          </div>
        )}
      </section>

      {/* --- Señales del prospecto ----------------------------------------- */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Sobre el prospecto</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Opcional. Afina la calificación, que es lo que decide si vale la pena ofrecerle reunión. Sin esto se
            califica solo por el tamaño del proyecto.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Campo etiqueta="¿Es dueño del inmueble?">
            <select
              value={senales.esPropietario === undefined ? "" : senales.esPropietario ? "si" : "no"}
              onChange={(e) =>
                setSenales((s) => ({
                  ...s,
                  esPropietario: e.target.value === "" ? undefined : e.target.value === "si",
                }))
              }
              className={entradaClase}
            >
              <option value="">No se sabe</option>
              <option value="si">Sí, es propietario</option>
              <option value="no">No, es arrendatario</option>
            </select>
          </Campo>

          <Campo etiqueta="¿Para cuándo lo tiene pensado?">
            <select
              value={senales.cuandoLoHaria ?? ""}
              onChange={(e) =>
                setSenales((s) => ({
                  ...s,
                  cuandoLoHaria: (e.target.value || undefined) as typeof s.cuandoLoHaria,
                }))
              }
              className={entradaClase}
            >
              <option value="">No se sabe</option>
              <option value="ya">Lo quiere hacer ya</option>
              <option value="este-ano">Este año</option>
              <option value="explorando">Solo está explorando</option>
            </select>
          </Campo>
        </div>

        <div className="flex flex-wrap gap-4">
          <Casilla
            marcada={senales.preguntoFinanciacion}
            onChange={(v) => setSenales((s) => ({ ...s, preguntoFinanciacion: v }))}
            etiqueta="Preguntó por financiación"
            nota="la señal más fuerte de todas"
          />
          <Casilla
            marcada={senales.pidioCotizacion}
            onChange={(v) => setSenales((s) => ({ ...s, pidioCotizacion: v }))}
            etiqueta="Pidió cotización formal"
          />
        </div>
      </section>

      {/* --- Acciones ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCalcular}
          disabled={!listo || calculando}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {calculando ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
          Calcular
        </button>

        {resultado && (
          <>
            <select
              value={leadId ?? ""}
              onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : null)}
              className={cn(entradaClase, "w-auto min-w-[220px]")}
            >
              <option value="">Sin asociar a un prospecto</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                  {l.empresa ? ` — ${l.empresa}` : ""}
                  {l.consumoKwh ? ` (${l.consumoKwh} kWh)` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onGuardar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar estudio
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onLimpiar}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary transition-colors ml-auto"
        >
          <RotateCcw size={13} />
          Empezar de cero
        </button>
      </div>

      {!listo && (
        <p className="text-[12px] text-muted-foreground">
          Faltan el consumo mensual y el costo del kWh. Son los dos únicos datos sin los que no se puede calcular
          nada.
        </p>
      )}

      {resultado && <Resultado r={resultado} calificacion={calificacion} />}
    </div>
  );
}

function Casilla({
  marcada,
  onChange,
  etiqueta,
  nota,
}: {
  marcada: boolean;
  onChange: (v: boolean) => void;
  etiqueta: string;
  nota?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={marcada}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary w-4 h-4"
      />
      <span className="text-secondary">{etiqueta}</span>
      {nota && <span className="text-[11px] text-muted-foreground">({nota})</span>}
    </label>
  );
}
