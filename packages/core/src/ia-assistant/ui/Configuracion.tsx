"use client";

import * as React from "react";
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Power,
  Plus,
  Trash2,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "../../utils";
import {
  cargarConfiguracion,
  cargarPrompt,
  guardarConfiguracion,
  volverAValoresDeOrigen,
} from "../acciones-config";
import { cargarModelos } from "../acciones-avanzadas";
import type { Ajustes, EjemploTono, ModeloDisponible } from "../cliente";

/**
 * Configuración del comportamiento del asistente.
 *
 * Lo que se toca aquí llega al siguiente mensaje sin reiniciar nada: el prompt
 * se compila en cada turno. Por eso mismo conviene el botón de "ver el prompt":
 * enseña el efecto real de cada cambio en vez de pedir que se confíe en que la
 * casilla hace lo que promete.
 *
 * Lo que NO está aquí, a propósito: el conocimiento, las herramientas, el
 * horario y las reglas duras. Eso es la estructura del asistente y vive en su
 * YAML, donde se edita con el archivo delante. Aquí están las perillas que se
 * mueven a diario. Meterlo todo en un formulario acaba en una pantalla que
 * nadie mantiene y en un asistente roto por un clic distraído.
 */

/** USD por millón de tokens, en corto. `null` = precio variable. */
function precioCorto(v: number | null): string {
  if (v === null) return "precio variable";
  if (v === 0) return "gratis";
  if (v < 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(v < 10 ? 1 : 0)}`;
}

function Etiqueta({
  children,
  ayuda,
  modificado,
}: {
  children: React.ReactNode;
  ayuda?: string;
  modificado?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 mb-1.5">
      <label className="text-xs font-bold text-secondary/70 uppercase tracking-wider">
        {children}
      </label>
      {modificado && (
        <span className="text-[10px] font-semibold text-primary uppercase">cambiado</span>
      )}
      {ayuda && <span className="text-[11px] text-muted-foreground font-light">{ayuda}</span>}
    </div>
  );
}

function ListaEditable({
  valores,
  onChange,
  placeholder,
}: {
  valores: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {valores.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={v}
            onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => onChange(valores.filter((_, j) => j !== i))}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Quitar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...valores, ""])}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Plus size={14} /> {placeholder}
      </button>
    </div>
  );
}

export default function Configuracion({ disponible }: { disponible: boolean }) {
  const [ajustes, setAjustes] = React.useState<Ajustes | null>(null);
  const [origen, setOrigen] = React.useState<Ajustes | null>(null);
  const [modificados, setModificados] = React.useState<string[]>([]);
  const [sucio, setSucio] = React.useState(false);
  const [error, setError] = React.useState("");
  const [aviso, setAviso] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [prompt, setPrompt] = React.useState<string | null>(null);
  const [modelos, setModelos] = React.useState<ModeloDisponible[]>([]);

  const cargar = React.useCallback(async () => {
    const r = await cargarConfiguracion();
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudo cargar la configuración.");
      return;
    }
    setAjustes(r.datos.ajustes);
    setOrigen(r.datos.origen);
    setModificados(r.datos.modificados);
    setSucio(false);
  }, []);

  React.useEffect(() => {
    if (disponible) void cargar();
  }, [disponible, cargar]);

  // El catálogo se pide aparte: si OpenRouter no responde, el resto de la
  // pantalla sigue funcionando y el modelo cae a un campo de texto libre. Es
  // peor no poder cambiarlo que no tener la lista.
  React.useEffect(() => {
    if (!disponible) return;
    void cargarModelos().then((r) => {
      if (r.ok && r.datos) setModelos(r.datos);
    });
  }, [disponible]);

  const set = <K extends keyof Ajustes>(k: K, v: Ajustes[K]) => {
    setAjustes((a) => (a ? { ...a, [k]: v } : a));
    setSucio(true);
    setAviso("");
  };

  const guardar = async () => {
    if (!ajustes) return;
    setGuardando(true);
    setError("");
    const r = await guardarConfiguracion(ajustes);
    setGuardando(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo guardar.");
      return;
    }
    setAviso("Guardado. Aplica desde el próximo mensaje.");
    setPrompt(null);
    void cargar();
  };

  const restaurar = async () => {
    if (!confirm("¿Volver a los valores de origen? Se pierde todo lo que hayas ajustado aquí.")) {
      return;
    }
    const r = await volverAValoresDeOrigen();
    if (!r.ok) {
      setError(r.error ?? "No se pudo restaurar.");
      return;
    }
    setAviso("Restaurado a los valores de origen.");
    setPrompt(null);
    void cargar();
  };

  const verPrompt = async () => {
    if (prompt) {
      setPrompt(null);
      return;
    }
    const r = await cargarPrompt();
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudo leer el prompt.");
      return;
    }
    setPrompt(r.datos.prompt);
  };

  if (!disponible) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <h2 className="text-lg font-bold mb-2">Esta línea todavía no tiene asistente</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cuando esté configurada, aquí se ajusta cómo responde.
        </p>
      </div>
    );
  }

  if (!ajustes || !origen) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-sm text-muted-foreground">
        {error || "Cargando configuración…"}
      </div>
    );
  }

  const cambiado = (k: string) => modificados.includes(k);

  return (
    <div className="space-y-5 pb-24">
      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {aviso && (
        <div className="flex gap-2 items-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 size={16} /> {aviso}
        </div>
      )}

      {/* Interruptor general */}
      <section
        className={cn(
          "border rounded-xl p-4 flex items-center justify-between gap-4",
          ajustes.pausado ? "bg-red-50 border-red-200" : "bg-card border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <Power size={18} className={ajustes.pausado ? "text-red-600 mt-0.5" : "text-green-600 mt-0.5"} />
          <div>
            <h3 className="font-bold text-sm">
              {ajustes.pausado ? "Asistente en pausa" : "Asistente atendiendo"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ajustes.pausado
                ? "No responde a nadie, en ninguna conversación. Los mensajes llegan pero quedan sin contestar."
                : "Responde automáticamente en las conversaciones que no hayas tomado tú."}
            </p>
          </div>
        </div>
        <button
          onClick={() => set("pausado", !ajustes.pausado)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
            ajustes.pausado
              ? "border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
              : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
          )}
        >
          {ajustes.pausado ? "Reactivar" : "Pausar"}
        </button>
      </section>

      {/* Estilo */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">
          Cómo escribe
        </h3>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Etiqueta ayuda="ni tan largo que canse, ni tan seco que corte" modificado={cambiado("largoObjetivo")}>
              Largo objetivo
            </Etiqueta>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={120}
                max={900}
                step={20}
                value={ajustes.largoObjetivo}
                onChange={(e) => set("largoObjetivo", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-20 text-right">{ajustes.largoObjetivo} car.</span>
            </div>
          </div>

          <div>
            <Etiqueta ayuda="tuteo, usted, o seguir al cliente" modificado={cambiado("tratamiento")}>
              Trato
            </Etiqueta>
            <select
              value={ajustes.tratamiento}
              onChange={(e) => set("tratamiento", e.target.value as Ajustes["tratamiento"])}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="reflejar">Reflejar al cliente (recomendado)</option>
              <option value="tu">Siempre tutear</option>
              <option value="usted">Siempre de usted</option>
            </select>
          </div>
        </div>

        <div>
          <Etiqueta ayuda="se añade al final del prompt, tal cual" modificado={cambiado("instruccionExtra")}>
            Instrucción adicional
          </Etiqueta>
          <textarea
            rows={3}
            value={ajustes.instruccionExtra}
            onChange={(e) => set("instruccionExtra", e.target.value)}
            placeholder="Ej. Menciona que trabajamos con empresas de la costa cuando venga al caso."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Etiqueta ayuda="las usa cuando encajan solas" modificado={cambiado("frasesPropias")}>
              Expresiones de la casa
            </Etiqueta>
            <ListaEditable
              valores={ajustes.frasesPropias}
              onChange={(v) => set("frasesPropias", v)}
              placeholder="Agregar expresión"
            />
          </div>
          <div>
            <Etiqueta ayuda="lo que delata a un bot" modificado={cambiado("evitar")}>
              Qué no debe hacer
            </Etiqueta>
            <ListaEditable
              valores={ajustes.evitar}
              onChange={(v) => set("evitar", v)}
              placeholder="Agregar regla"
            />
          </div>
        </div>
      </section>

      {/* Ejemplos */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">
            Ejemplos comparados
          </h3>
          <p className="text-xs text-muted-foreground mt-1 flex gap-1.5 items-start">
            <Info size={13} className="shrink-0 mt-0.5" />
            Es lo que más mueve el tono, más que cualquier regla escrita. Si una respuesta te
            suena mal, pégala en <strong>MAL</strong> y escribe al lado cómo debió responder.
          </p>
        </div>

        {ajustes.ejemplos.map((e, i) => (
          <article key={i} className="border border-border rounded-xl p-4 space-y-2 bg-muted/20">
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ejemplo {i + 1}
              </span>
              <button
                onClick={() => set("ejemplos", ajustes.ejemplos.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Quitar ejemplo"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {(["cliente", "mal", "bien"] as (keyof EjemploTono)[]).map((campo) => (
              <div key={campo}>
                <label
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    campo === "mal" ? "text-red-600" : campo === "bien" ? "text-green-700" : "text-secondary/60",
                  )}
                >
                  {campo === "cliente" ? "Dice el cliente" : campo === "mal" ? "Mal" : "Bien"}
                </label>
                <textarea
                  rows={campo === "cliente" ? 1 : 2}
                  value={e[campo]}
                  onChange={(ev) =>
                    set(
                      "ejemplos",
                      ajustes.ejemplos.map((x, j) => (j === i ? { ...x, [campo]: ev.target.value } : x)),
                    )
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
          </article>
        ))}

        <button
          onClick={() => set("ejemplos", [...ajustes.ejemplos, { cliente: "", mal: "", bien: "" }])}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <Plus size={14} /> Agregar ejemplo
        </button>
      </section>

      {/* Motor */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Motor</h3>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Etiqueta
              ayuda="más alto = más variado y menos predecible"
              modificado={cambiado("temperatura")}
            >
              Temperatura
            </Etiqueta>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ajustes.temperatura}
                onChange={(e) => set("temperatura", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">
                {ajustes.temperatura.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              El tono está calibrado en {origen.temperatura.toFixed(2)}. Subirlo mucho hace que
              cada respuesta salga distinta y deje de parecerse a lo probado.
            </p>
          </div>

          <div>
            <Etiqueta
              ayuda={modelos.length ? `${modelos.length} disponibles` : "catálogo no disponible"}
              modificado={cambiado("modelo")}
            >
              Modelo
            </Etiqueta>
            {modelos.length > 0 ? (
              <>
                <select
                  value={modelos.some((m) => m.id === ajustes.modelo) ? ajustes.modelo : "__otro"}
                  onChange={(e) => e.target.value !== "__otro" && set("modelo", e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {!modelos.some((m) => m.id === ajustes.modelo) && (
                    <option value="__otro">{ajustes.modelo} (escrito a mano)</option>
                  )}
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.gratis ? "· gratis · " : `· ${precioCorto(m.salidaPorMillon)} · `}
                      {m.nombre}
                    </option>
                  ))}
                </select>
                {(() => {
                  const sel = modelos.find((m) => m.id === ajustes.modelo);
                  if (!sel) return null;
                  return (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {sel.gratis
                        ? "Sin costo. Suelen tener límites de uso y menos calidad; útiles para probar."
                        : `${precioCorto(sel.entradaPorMillon)} por millón de tokens de entrada, ${precioCorto(sel.salidaPorMillon)} de salida.`}
                      {sel.contexto ? ` Contexto de ${new Intl.NumberFormat("es-CO").format(sel.contexto)} tokens.` : ""}
                    </p>
                  );
                })()}
              </>
            ) : (
              <input
                value={ajustes.modelo}
                onChange={(e) => set("modelo", e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono"
              />
            )}
            <p className="text-[11px] text-amber-700 mt-1">
              Cambiar de modelo cambia el tono. Lo calibrado está con{" "}
              <span className="font-mono">{origen.modelo}</span>; después de cambiarlo, revisa una
              conversación real antes de dejarlo.
            </p>
          </div>

          <div>
            <Etiqueta
              ayuda="segundos de silencio antes de contestar"
              modificado={cambiado("debounceSegundos")}
            >
              Espera para agrupar mensajes
            </Etiqueta>
            <input
              type="number"
              min={3}
              max={120}
              value={ajustes.debounceSegundos}
              onChange={(e) => set("debounceSegundos", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              La gente escribe en ráfagas. Esperar agrupa esas líneas en una sola respuesta;
              bajarlo mucho hace que conteste cada línea suelta.
            </p>
          </div>

          <div>
            <Etiqueta ayuda="aunque siga escribiendo" modificado={cambiado("esperaMaximaSegundos")}>
              Tope de espera
            </Etiqueta>
            <input
              type="number"
              min={5}
              max={300}
              value={ajustes.esperaMaximaSegundos}
              onChange={(e) => set("esperaMaximaSegundos", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Cadencia */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">
          Insistencia en el primer contacto
        </h3>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Etiqueta ayuda="máximo 5, por diseño" modificado={cambiado("maxToques")}>
              Mensajes sin respuesta
            </Etiqueta>
            <input
              type="number"
              min={1}
              max={5}
              value={ajustes.maxToques}
              onChange={(e) => set("maxToques", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              El tope de 5 no se puede subir desde aquí: insistir más no convierte leads, quema el
              número y la marca.
            </p>
          </div>

          <div>
            <Etiqueta ayuda="separados por coma" modificado={cambiado("esperaDias")}>
              Días de espera entre mensajes
            </Etiqueta>
            <input
              value={ajustes.esperaDias.join(", ")}
              onChange={(e) =>
                set(
                  "esperaDias",
                  e.target.value
                    .split(",")
                    .map((x) => Number(x.trim()))
                    .filter((x) => !Number.isNaN(x)),
                )
              }
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              El primero es 0: el primer contacto sale de inmediato.
            </p>
          </div>
        </div>
      </section>

      {/* Prompt */}
      <section className="bg-card border border-border rounded-xl p-5">
        <button
          onClick={() => void verPrompt()}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Eye size={15} /> {prompt ? "Ocultar" : "Ver"} las instrucciones que recibe el modelo
        </button>
        {prompt && (
          <pre className="mt-4 text-[11px] leading-relaxed bg-muted/40 border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-[28rem] overflow-y-auto">
            {prompt}
          </pre>
        )}
        {prompt && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Esto es lo que el modelo lee antes de cada respuesta. Refleja lo último guardado, no
            lo que tengas sin guardar en pantalla.
          </p>
        )}
      </section>

      {/* Barra de guardado */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-card border-t border-border p-4 flex items-center justify-between gap-3 z-40">
        <button
          onClick={() => void restaurar()}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
        >
          <RotateCcw size={14} /> Volver a los valores de origen
        </button>
        <div className="flex items-center gap-3">
          {sucio && (
            <span className="text-xs text-amber-700 font-semibold">Hay cambios sin guardar</span>
          )}
          <button
            onClick={() => void guardar()}
            disabled={guardando || !sucio}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Save size={15} /> {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
