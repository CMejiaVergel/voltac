"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, Check, Loader2, X } from "lucide-react";
import { cn } from "../../utils";
import { cargarSolicitudes, resolverSolicitudCita } from "../acciones-avanzadas";
import type { SolicitudCita } from "../cliente";

/**
 * Peticiones de mover o cancelar una cita, esperando decisión de una persona.
 *
 * El asistente puede crear citas pero no tocar las que ya existen. La asimetría
 * es deliberada: crear de más deja un hueco en la agenda, mientras que mover o
 * cancelar por error destruye un compromiso con un cliente y nadie se entera
 * hasta que alguien no aparece. Ya ocurrió una vez.
 *
 * Así que el asistente atiende la petición con normalidad, comprueba si la
 * franja está libre y la deja aquí. Quien decide mueve la cita en Google y
 * aprueba; al aprobar, el cliente recibe el aviso de vuelta.
 */

const REFRESCO_MS = 20_000;

export function Solicitudes() {
  const [lista, setLista] = React.useState<SolicitudCita[] | null>(null);
  const [error, setError] = React.useState("");
  const [abierta, setAbierta] = React.useState<string | null>(null);
  /**
   * Que se decidio. Es lo primero que se elige, y de ahi sale todo lo demas.
   *
   * Antes el cuadro venia con el mensaje de exito ya escrito y los dos botones
   * mandaban ese mismo texto. Quien rechazaba sin editarlo le confirmaba al
   * cliente que su cita habia quedado reprogramada. Paso de verdad.
   */
  const [decision, setDecision] = React.useState<"si" | "no" | null>(null);
  const [alternativas, setAlternativas] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [tocado, setTocado] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);

  const refrescar = React.useCallback(async () => {
    const r = await cargarSolicitudes();
    if (r.ok && r.datos) {
      setLista(r.datos);
      setError("");
    } else {
      setError(r.error ?? "No se pudieron cargar las solicitudes.");
      setLista([]);
    }
  }, []);

  React.useEffect(() => {
    void refrescar();
    const t = setInterval(() => void refrescar(), REFRESCO_MS);
    return () => clearInterval(t);
  }, [refrescar]);

  function abrir(s: SolicitudCita) {
    setAbierta(s.id);
    setDecision(null);
    setAlternativas("");
    setMensaje("");
    setTocado(false);
  }

  /**
   * Redacta el aviso a partir de la decision, no al reves.
   *
   * El borrador se rehace solo mientras nadie lo haya tocado a mano. En cuanto
   * alguien escribe, se respeta lo suyo: nada mas irritante que un cuadro que
   * borra lo que acabas de escribir porque cambiaste una casilla.
   */
  const redactar = React.useCallback(
    (s: SolicitudCita, d: "si" | "no", alts: string): string => {
      const nombre = s.nombre ? `, ${s.nombre.split(" ")[0]}` : "";
      /* "a. m." ya termina en punto, asi que al pegarle otra frase sale
         "10:00 a. m..". Solo se colapsa el punto repetido: la coma que sigue
         --"a. m., pero si"-- es correcta y no hay que tocarla. */
      const limpio = (t: string) => t.replace(/\.\.+/g, ".");

      if (d === "si") {
        return limpio(s.tipo === "mover"
          ? `Listo${nombre}. Tu reunión quedó reprogramada${
              s.cuandoPropone ? ` para el ${s.cuandoPropone}` : ""
            }. Te llega la invitación actualizada al correo.`
          : `Listo${nombre}. Tu reunión quedó cancelada. Cuando quieras retomarla me escribes por aquí.`);
      }

      if (s.tipo === "cancelar") {
        return `${nombre ? `Hola${nombre}` : "Hola"}. No pude cancelar la reunión por este medio; alguien del equipo te contacta para coordinarlo.`;
      }

      const base = `${nombre ? `Hola${nombre}` : "Hola"}. No tengo disponible${
        s.cuandoPropone ? ` el ${s.cuandoPropone}` : " esa hora"
      }`;

      /* Rechazar sin ofrecer nada deja al cliente en el aire y obliga a otra
         vuelta. Si hay alternativas, el mensaje las lleva y la conversacion
         puede cerrarse en el siguiente mensaje del cliente. */
      return limpio(
        alts.trim()
          ? `${base}, pero sí ${alts.trim()}. ¿Cuál te sirve?`
          : `${base}. ¿Qué otro día te queda bien y lo miramos?`,
      );
    },
    [],
  );

  React.useEffect(() => {
    if (!abierta || !decision || tocado) return;
    const s = (lista ?? []).find((x) => x.id === abierta);
    if (s) setMensaje(redactar(s, decision, alternativas));
  }, [abierta, decision, alternativas, tocado, lista, redactar]);

  async function resolver(id: string) {
    if (!decision) return;
    setEnviando(true);
    setError("");
    const r = await resolverSolicitudCita(id, decision === "si" ? "resuelta" : "rechazada", mensaje.trim());
    setEnviando(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo resolver.");
      return;
    }
    setAbierta(null);
    setDecision(null);
    setAlternativas("");
    setMensaje("");
    setTocado(false);
    void refrescar();
  }

  const pendientes = (lista ?? []).filter((s) => s.estado === "pendiente");
  const resueltas = (lista ?? []).filter((s) => s.estado !== "pendiente").slice(0, 5);

  if (lista === null) {
    return (
      <section className="bg-card border border-border rounded-xl p-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" />
        Buscando solicitudes…
      </section>
    );
  }

  if (!pendientes.length && !resueltas.length && !error) return null;

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary flex items-center gap-2">
            <CalendarClock size={16} />
            Cambios de cita por aprobar
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
            El asistente puede crear citas, pero no mover ni cancelar las que ya existen. Cuando un cliente lo
            pide, la petición llega aquí. Mueve la cita en Google y después apruébala: al aprobar, el cliente
            recibe el aviso.
          </p>
        </div>
        {pendientes.length > 0 && (
          <span className="px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold shrink-0">
            {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {pendientes.length === 0 && !error && (
        <p className="text-[12px] text-muted-foreground">No hay nada esperando.</p>
      )}

      {pendientes.map((s) => (
        <div key={s.id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                s.tipo === "cancelar"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700",
              )}
            >
              {s.tipo === "cancelar" ? "cancelar" : "reprogramar"}
            </span>
            <span className="font-bold text-secondary text-sm">{s.nombre ?? s.conversationId}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(s.creadaEn).toLocaleString("es-CO", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-[13px] text-secondary leading-relaxed">{s.pedido}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {s.cuandoPropone && (
              <span>
                Propone: <strong className="text-secondary">{s.cuandoPropone}</strong>
              </span>
            )}
            {/* Lo primero que uno necesita saber para decidir en dos segundos. */}
            {s.franjaLibre === true && <span className="text-green-700 font-semibold">Franja libre</span>}
            {s.franjaLibre === false && <span className="text-red-700 font-semibold">Franja ocupada</span>}
            {s.correo && <span>{s.correo}</span>}
          </div>

          {abierta === s.id ? (
            <div className="space-y-3 pt-1">
              {/* Primero la decision. Todo lo demas --el borrador incluido--
                  sale de aqui, y por eso no hay nada escrito hasta elegir. */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  ¿Se puede {s.tipo === "cancelar" ? "cancelar" : `mover${s.cuandoPropone ? ` al ${s.cuandoPropone}` : ""}`}?
                </label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setDecision("si"); setTocado(false); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      decision === "si"
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <Check size={13} />
                    Sí, ya la moví
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDecision("no"); setTocado(false); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      decision === "no"
                        ? "bg-red-600 border-red-600 text-white"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <X size={13} />
                    No a esa hora
                  </button>
                </div>
              </div>

              {/* Rechazar sin ofrecer nada deja al cliente en el aire y obliga
                  a otra vuelta entera. Con alternativas, la conversacion puede
                  cerrarse en su siguiente mensaje. */}
              {decision === "no" && s.tipo === "mover" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    ¿Qué horas sí puedes ofrecerle?
                  </label>
                  <input
                    type="text"
                    value={alternativas}
                    onChange={(e) => { setAlternativas(e.target.value); setTocado(false); }}
                    placeholder="el viernes 14 a las 2 p.m. o el lunes 17 a las 9 a.m."
                    className="w-full mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Escríbelas como se las dirías. Cuando el cliente elija una, te llega otra solicitud para
                    aprobarla.
                  </p>
                </div>
              )}

              {decision && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lo que se le va a escribir al cliente
                  </label>
                  <textarea
                    rows={3}
                    value={mensaje}
                    onChange={(e) => { setMensaje(e.target.value); setTocado(true); }}
                    className="w-full mt-1 resize-none rounded-lg border border-border bg-card p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Sale como mensaje del asistente y no toma la conversación: él sigue atendiendo después.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void resolver(s.id)}
                  disabled={enviando || !decision || !mensaje.trim()}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-colors",
                    decision === "no" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                  )}
                >
                  {enviando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Enviar y cerrar la solicitud
                </button>
                <button
                  type="button"
                  onClick={() => { setAbierta(null); setDecision(null); }}
                  className="px-3 py-2 rounded-lg border border-border text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => abrir(s)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Resolver
            </button>
          )}
        </div>
      ))}

      {resueltas.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Últimas resueltas
          </div>
          {resueltas.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-[12px] text-muted-foreground py-0.5">
              <Check size={12} className={s.estado === "resuelta" ? "text-green-600" : "text-red-600"} />
              <span className="text-secondary">{s.nombre ?? s.conversationId}</span>
              <span>· {s.tipo === "cancelar" ? "cancelación" : "reprogramación"}</span>
              {s.resueltaPor && <span>· {s.resueltaPor}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
