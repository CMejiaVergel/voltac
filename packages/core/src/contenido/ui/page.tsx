"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Video,
  Scissors,
  Send,
  Users,
  Megaphone,
  Bell,
} from "lucide-react";
import { cn } from "../../utils";
import {
  ESTADOS,
  ESTADO_ETIQUETA,
  MARCAS,
  MARCA_ETIQUETA,
  TIPOS,
  TIPO_ETIQUETA,
  type Actividad,
  type ActividadNueva,
  type Marca,
  type Tipo,
} from "../types";

/**
 * Calendario editorial.
 *
 * Es la portada del moderador. La primera pregunta que responde no es "qué hay
 * este mes" sino "qué me toca hoy y esta semana", por eso el mes es el mapa y
 * el detalle del día es lo que ocupa el espacio de lectura.
 *
 * Las fechas se manejan como reloj de pared de Colombia, sin convertir a UTC en
 * ningún punto: se construyen y se comparan como texto `YYYY-MM-DDTHH:MM`. Ver
 * la nota en `db.ts` sobre por qué.
 */

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ICONO: Record<Tipo, React.ReactNode> = {
  grabacion: <Video size={13} />,
  edicion: <Scissors size={13} />,
  publicacion: <Send size={13} />,
  reunion: <Users size={13} />,
  campana: <Megaphone size={13} />,
  recordatorio: <Bell size={13} />,
};

const COLOR: Record<Tipo, string> = {
  grabacion: "bg-purple-50 text-purple-700 border-purple-300",
  edicion: "bg-sky-50 text-sky-700 border-sky-300",
  publicacion: "bg-emerald-50 text-emerald-700 border-emerald-300",
  reunion: "bg-amber-50 text-amber-700 border-amber-300",
  campana: "bg-rose-50 text-rose-700 border-rose-300",
  recordatorio: "bg-slate-50 text-slate-600 border-slate-300",
};

const MARCA_PUNTO: Record<Marca, string> = {
  systems: "bg-blue-500",
  energy: "bg-green-500",
  ambas: "bg-slate-400",
};

/* ── fechas, sin husos de por medio ── */
const aTexto = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoyTexto = () => aTexto(new Date());
const diaDe = (iso: string) => iso.slice(0, 10);
const horaDe = (iso: string) => iso.slice(11, 16);

/** Lunes de la semana en la que cae la fecha. */
function lunesDe(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return r;
}

/** Las seis semanas que hay que pintar para cubrir el mes entero. */
function celdasDelMes(anio: number, mes: number): Date[] {
  const inicio = lunesDe(new Date(anio, mes, 1));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

const VACIA: ActividadNueva = {
  marca: "ambas",
  titulo: "",
  tipo: "publicacion",
  inicia_en: `${hoyTexto()}T09:00`,
  duracion_min: 60,
  todo_el_dia: false,
  estado: "planificada",
};

export default function CalendarioContenidoPage() {
  const ahora = new Date();
  const [anio, setAnio] = React.useState(ahora.getFullYear());
  const [mes, setMes] = React.useState(ahora.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = React.useState(hoyTexto());
  const [actividades, setActividades] = React.useState<Actividad[]>([]);
  const [filtroMarca, setFiltroMarca] = React.useState<Marca | "todas">("todas");
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editando, setEditando] = React.useState<Actividad | null>(null);
  const [creando, setCreando] = React.useState<ActividadNueva | null>(null);

  const celdas = React.useMemo(() => celdasDelMes(anio, mes), [anio, mes]);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    const desde = aTexto(celdas[0]);
    const hasta = aTexto(celdas[celdas.length - 1]);
    try {
      const res = await fetch(`/api/contenido?desde=${desde}&hasta=${hasta}`);
      const j = await res.json();
      if (j.success) setActividades(j.data);
      else setError(j.error ?? "No se pudo cargar el calendario.");
    } catch {
      setError("No se pudo contactar al servidor.");
    }
    setCargando(false);
  }, [celdas]);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = React.useMemo(
    () =>
      filtroMarca === "todas"
        ? actividades
        : actividades.filter((a) => a.marca === filtroMarca || a.marca === "ambas"),
    [actividades, filtroMarca],
  );

  const porDia = React.useMemo(() => {
    const mapa = new Map<string, Actividad[]>();
    for (const a of visibles) {
      const d = diaDe(a.inicia_en);
      if (!mapa.has(d)) mapa.set(d, []);
      mapa.get(d)!.push(a);
    }
    return mapa;
  }, [visibles]);

  const delDia = porDia.get(diaSeleccionado) ?? [];

  const mover = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  const guardar = async (datos: ActividadNueva, id?: number) => {
    setError("");
    const res = await fetch(id ? `/api/contenido/${id}` : "/api/contenido", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const j = await res.json();
    if (!j.success) {
      setError(j.error ?? "No se pudo guardar.");
      return false;
    }
    await cargar();
    return true;
  };

  const borrar = async (id: number) => {
    const res = await fetch(`/api/contenido/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!j.success) return setError(j.error ?? "No se pudo borrar.");
    setEditando(null);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-primary"
            style={{ fontFamily: "Akira Expanded, sans-serif" }}
          >
            CALENDARIO DE CONTENIDO
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Grabaciones, publicaciones, reuniones y campañas de las dos marcas.
          </p>
        </div>

        <button
          onClick={() => setCreando({ ...VACIA, inicia_en: `${diaSeleccionado}T09:00` })}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          <Plus size={18} /> Nueva actividad
        </button>
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => mover(-1)}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold min-w-[10rem] text-center">
            {MESES[mes]} {anio}
          </span>
          <button
            onClick={() => mover(1)}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => {
              const h = new Date();
              setAnio(h.getFullYear());
              setMes(h.getMonth());
              setDiaSeleccionado(hoyTexto());
            }}
            className="ml-2 text-sm text-primary font-medium hover:underline"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {(["todas", ...MARCAS] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFiltroMarca(m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                filtroMarca === m ? "bg-white shadow-sm text-primary" : "text-muted-foreground",
              )}
            >
              {m === "todas" ? "Todas" : MARCA_ETIQUETA[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
        {/* Rejilla del mes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
            {DIAS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {celdas.map((d) => {
              const texto = aTexto(d);
              const delMes = d.getMonth() === mes;
              const esHoy = texto === hoyTexto();
              const items = porDia.get(texto) ?? [];

              return (
                <button
                  key={texto}
                  onClick={() => setDiaSeleccionado(texto)}
                  className={cn(
                    "min-h-[5.5rem] border-b border-r border-border p-1.5 text-left align-top transition-colors",
                    !delMes && "bg-muted/30",
                    diaSeleccionado === texto ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1",
                      esHoy ? "bg-primary text-white" : delMes ? "text-foreground" : "text-muted-foreground/50",
                    )}
                  >
                    {d.getDate()}
                  </span>

                  <div className="space-y-1">
                    {items.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={cn(
                          "flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] font-medium truncate",
                          COLOR[a.tipo],
                          a.estado === "cancelada" && "opacity-40 line-through",
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", MARCA_PUNTO[a.marca])} />
                        <span className="truncate">
                          {a.todo_el_dia ? "" : `${horaDe(a.inicia_en)} `}
                          {a.titulo}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{items.length - 3} más</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del dia */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:sticky lg:top-4">
          <h2 className="font-semibold mb-1">
            {new Date(`${diaSeleccionado}T12:00`).toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {cargando
              ? "Cargando…"
              : delDia.length === 0
                ? "Sin actividades."
                : `${delDia.length} actividad(es)`}
          </p>

          <div className="space-y-2">
            {delDia.map((a) => (
              <button
                key={a.id}
                onClick={() => setEditando(a)}
                className="w-full text-left border border-border rounded-xl p-3 hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold", COLOR[a.tipo])}>
                    {ICONO[a.tipo]} {TIPO_ETIQUETA[a.tipo]}
                  </span>
                  <span className={cn("w-2 h-2 rounded-full", MARCA_PUNTO[a.marca])} title={MARCA_ETIQUETA[a.marca]} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.todo_el_dia ? "Todo el día" : horaDe(a.inicia_en)}
                  </span>
                </div>
                <p className={cn("text-sm font-semibold", a.estado === "cancelada" && "line-through opacity-50")}>
                  {a.titulo}
                </p>
                {a.responsable && (
                  <p className="text-xs text-muted-foreground mt-0.5">{a.responsable}</p>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCreando({ ...VACIA, inicia_en: `${diaSeleccionado}T09:00` })}
            className="mt-4 w-full border border-dashed border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            + Añadir a este día
          </button>
        </div>
      </div>

      {(creando || editando) && (
        <ModalActividad
          inicial={creando ?? editando!}
          esNueva={Boolean(creando)}
          onCerrar={() => {
            setCreando(null);
            setEditando(null);
          }}
          onGuardar={async (datos) => {
            const ok = await guardar(datos, editando?.id);
            if (ok) {
              setCreando(null);
              setEditando(null);
            }
          }}
          onBorrar={editando ? () => borrar(editando.id) : undefined}
        />
      )}
    </div>
  );
}

function ModalActividad({
  inicial,
  esNueva,
  onCerrar,
  onGuardar,
  onBorrar,
}: {
  inicial: Actividad | ActividadNueva;
  esNueva: boolean;
  onCerrar: () => void;
  onGuardar: (datos: ActividadNueva) => void | Promise<void>;
  onBorrar?: () => void;
}) {
  const [form, setForm] = React.useState<ActividadNueva>({
    marca: inicial.marca,
    titulo: inicial.titulo,
    tipo: inicial.tipo,
    inicia_en: inicial.inicia_en,
    duracion_min: inicial.duracion_min,
    todo_el_dia: inicial.todo_el_dia,
    estado: inicial.estado,
    responsable: inicial.responsable ?? "",
    notas: inicial.notas ?? "",
  });
  const [guardando, setGuardando] = React.useState(false);

  const campo = "w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary/70 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold">{esNueva ? "Nueva actividad" : "Editar actividad"}</h3>
          <button onClick={onCerrar} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título</span>
            <input
              autoFocus
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej. Grabar testimonio del cliente de Turbaco"
              className={campo}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</span>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as Tipo })}
                className={campo}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{TIPO_ETIQUETA[t]}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marca</span>
              <select
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value as Marca })}
                className={campo}
              >
                {MARCAS.map((m) => (
                  <option key={m} value={m}>{MARCA_ETIQUETA[m]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha y hora</span>
              <input
                type="datetime-local"
                value={form.inicia_en}
                onChange={(e) => setForm({ ...form, inicia_en: e.target.value.slice(0, 16) })}
                className={campo}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duración (min)</span>
              <input
                type="number"
                min={0}
                step={15}
                value={form.duracion_min}
                onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })}
                disabled={form.todo_el_dia}
                className={cn(campo, form.todo_el_dia && "opacity-50")}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.todo_el_dia}
              onChange={(e) => setForm({ ...form, todo_el_dia: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            Todo el día
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</span>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value as Actividad["estado"] })}
                className={campo}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>{ESTADO_ETIQUETA[s]}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsable</span>
              <input
                value={form.responsable ?? ""}
                onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                placeholder="Opcional"
                className={campo}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas</span>
            <textarea
              rows={3}
              value={form.notas ?? ""}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Guion, enlaces, material necesario…"
              className={cn(campo, "resize-none")}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 p-5 border-t border-border sticky bottom-0 bg-card">
          {onBorrar && (
            <button
              onClick={onBorrar}
              className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              title="Borrar actividad"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onCerrar}
            className="ml-auto px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={guardando || !form.titulo.trim()}
            onClick={async () => {
              setGuardando(true);
              await onGuardar(form);
              setGuardando(false);
            }}
            className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
