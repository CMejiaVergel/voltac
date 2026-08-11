"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  RefreshCw,
  CalendarCheck,
  FileText,
  Mail,
  UserCheck,
  MessageSquarePlus,
  ExternalLink,
  Bell,
  BellOff,
  Eraser,
} from "lucide-react";
import { cn } from "../../utils";
import { IconoCanal } from "./iconos";
import {
  consultarNovedades,
  reactivarAsistente,
  responder,
  traerConversacion,
  traerConversaciones,
} from "../acciones-bandeja";
import { limpiarConversacionConfirmada } from "../acciones-avanzadas";
import type { ConversacionDetalle, ConversacionResumen } from "../cliente";
import { SinAsistente } from "./SinAsistente";

/**
 * Bandeja de conversaciones del asistente.
 *
 * Es la pantalla que se mira todos los días, y está ordenada por lo que hace
 * falta decidir y no por lo que acaba de pasar: primero lo que espera respuesta,
 * y dentro de eso lo más viejo arriba. Alguien que escribió hace dos horas y
 * sigue colgado importa más que quien acaba de escribir y ya recibió respuesta.
 *
 * Escribir aquí **toma el control**: el asistente se calla en esa conversación
 * hasta que se le devuelva a mano. Sin vencimiento, a propósito — un bot que
 * vuelve a hablar solo a mitad de una conversación que alguien estaba llevando
 * es peor que un bot callado.
 */

const REFRESCO_MS = 8_000;

function hora(ms: number): string {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
}

/**
 * Se cuentan días de calendario, no bloques de 24 horas.
 *
 * Con horas transcurridas, un mensaje de ayer a las tres de la tarde visto esta
 * mañana cae en "hace 0 días" y la bandeja muestra "03:06 p. m." como si fuera
 * de hoy. Al abrir un chat colgado, confundir ayer con hoy cambia por completo
 * lo urgente que parece.
 */
function cuando(ms: number): string {
  const hoy = new Date();
  const fecha = new Date(ms);
  const aMedianoche = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((aMedianoche(hoy) - aMedianoche(fecha)) / 86_400_000);

  if (dias <= 0) return hora(ms);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(fecha);
}

const ICONO_ACCION: Record<string, React.ReactNode> = {
  cita_agendada: <CalendarCheck size={14} />,
  cita_cancelada: <CalendarCheck size={14} />,
  documento_enviado: <FileText size={14} />,
  correo_enviado: <Mail size={14} />,
  handoff: <UserCheck size={14} />,
  lead_contactado: <MessageSquarePlus size={14} />,
  respuesta_humana: <User size={14} />,
};

const TEXTO_ACCION: Record<string, string> = {
  cita_agendada: "Agendó la reunión",
  cita_cancelada: "Canceló la reunión",
  documento_enviado: "Envió un documento",
  correo_enviado: "Envió un correo",
  handoff: "Pasó el caso a una persona",
  lead_contactado: "Primer contacto enviado",
  respuesta_humana: "Respondió una persona",
};

export default function Bandeja({ disponible }: { disponible: boolean }) {
  const [lista, setLista] = React.useState<ConversacionResumen[]>([]);
  const [activa, setActiva] = React.useState<string | null>(null);
  const [detalle, setDetalle] = React.useState<ConversacionDetalle | null>(null);
  const [error, setError] = React.useState("");
  const [cargando, setCargando] = React.useState(true);
  const [texto, setTexto] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [avisos, setAvisos] = React.useState(false);
  const [borrando, setBorrando] = React.useState(false);
  const [clave, setClave] = React.useState("");
  const [borrandoAhora, setBorrandoAhora] = React.useState(false);

  const finHilo = React.useRef<HTMLDivElement | null>(null);
  // Arranca en "ahora": al abrir la bandeja no interesa que suenen los mensajes
  // que ya estaban, solo los que lleguen a partir de este momento.
  const cursor = React.useRef<number>(Date.now());

  const recargarLista = React.useCallback(async () => {
    const r = await traerConversaciones();
    if (!r.ok) {
      setError(r.error ?? "No se pudieron cargar las conversaciones.");
      setLista([]);
    } else {
      setError("");
      setLista(r.datos ?? []);
    }
    setCargando(false);
  }, []);

  const abrir = React.useCallback(async (id: string) => {
    setActiva(id);
    setTexto("");
    setBorrando(false);
    setClave("");
    const r = await traerConversacion(id);
    if (r.ok) setDetalle(r.datos ?? null);
    else setError(r.error ?? "No se pudo abrir la conversación.");
  }, []);

  React.useEffect(() => {
    if (!disponible) {
      setCargando(false);
      return;
    }
    void recargarLista();
  }, [disponible, recargarLista]);

  /*
   * Consulta periódica en vez de conexión persistente.
   *
   * Con un puñado de conversaciones a la vez, preguntar cada ocho segundos
   * cuesta menos que mantener viva una conexión y sobrevive a que el asistente
   * se reinicie sin dejar la pantalla muerta. Solo corre con la pestaña visible:
   * un panel olvidado en una pestaña de fondo no tiene por qué seguir
   * preguntando toda la noche.
   */
  React.useEffect(() => {
    if (!disponible) return;

    const tick = async () => {
      if (document.hidden) return;

      const r = await consultarNovedades(cursor.current);
      if (!r.ok || !r.datos) return;

      if (r.datos.nuevos > 0) {
        cursor.current = r.datos.ahora;
        void recargarLista();
        if (activa) void abrir(activa);
        if (avisos && "Notification" in window && Notification.permission === "granted") {
          new Notification("Mensaje nuevo en WhatsApp", {
            body:
              r.datos.nuevos === 1
                ? "Un prospecto acaba de escribir."
                : `${r.datos.nuevos} prospectos acaban de escribir.`,
            tag: "voltac-ia-assistant",
          });
        }
      }
    };

    const id = setInterval(() => void tick(), REFRESCO_MS);
    return () => clearInterval(id);
  }, [disponible, activa, avisos, recargarLista, abrir]);

  React.useEffect(() => {
    finHilo.current?.scrollIntoView({ behavior: "smooth" });
  }, [detalle?.mensajes.length]);

  const pedirPermisoAvisos = async () => {
    if (!("Notification" in window)) {
      setError("Este navegador no admite notificaciones de escritorio.");
      return;
    }
    if (Notification.permission === "granted") {
      setAvisos((v) => !v);
      return;
    }
    const permiso = await Notification.requestPermission();
    setAvisos(permiso === "granted");
  };

  const enviar = async () => {
    if (!activa || !texto.trim()) return;
    setEnviando(true);
    const r = await responder(activa, texto);
    setEnviando(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo enviar.");
      return;
    }
    setTexto("");
    setError("");
    await abrir(activa);
    void recargarLista();
  };

  /**
   * Borra la conversación entera.
   *
   * Pide la contraseña por lo mismo que borrar un lead: no protege contra quien
   * ya entró, protege contra el descuido. Un clic aquí borra la conversación de
   * un cliente real y no hay forma de recuperarla.
   */
  const limpiar = async () => {
    if (!activa) return;
    setBorrandoAhora(true);
    setError("");
    const r = await limpiarConversacionConfirmada(activa, clave, detalle?.nombre ?? activa);
    setBorrandoAhora(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo borrar.");
      return;
    }
    setClave("");
    setBorrando(false);
    setActiva(null);
    setDetalle(null);
    void recargarLista();
  };

  const devolver = async () => {
    if (!activa) return;
    const r = await reactivarAsistente(activa);
    if (!r.ok) {
      setError(r.error ?? "No se pudo reactivar el asistente.");
      return;
    }
    await abrir(activa);
    void recargarLista();
  };

  if (!disponible) {
    return (
      <SinAsistente />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-19rem)] min-h-[32rem]">
      {/* Lista */}
      <aside className="w-full lg:w-80 shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {lista.filter((c) => c.esperandoRespuesta).length > 0
              ? `${lista.filter((c) => c.esperandoRespuesta).length} sin responder`
              : `${lista.length} conversación(es)`}
          </span>
          <div className="flex gap-1">
            <button
              onClick={pedirPermisoAvisos}
              title={avisos ? "Desactivar avisos" : "Avisarme de mensajes nuevos"}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              {avisos ? <Bell size={15} className="text-primary" /> : <BellOff size={15} />}
            </button>
            <button
              onClick={() => void recargarLista()}
              title="Actualizar"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Todavía no hay conversaciones. Aparecen aquí en cuanto alguien escriba o se contacte
              un lead desde el CRM.
            </p>
          ) : (
            lista.map((c) => (
              <button
                key={c.conversationId}
                onClick={() => void abrir(c.conversationId)}
                className={cn(
                  "w-full text-left p-3 border-b border-border/60 transition-colors",
                  activa === c.conversationId ? "bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconoCanal canal={c.canal} />
                  <span className="font-semibold text-sm truncate flex-1">
                    {c.nombre ?? c.waId}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {cuando(c.ultimaActividad)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                  {c.ultimoMensajeDe === "cliente" ? "" : "Tú: "}
                  {c.ultimoMensaje ?? "(sin mensajes)"}
                </p>
                <div className="flex gap-1.5 mt-1.5 pl-6 flex-wrap">
                  {c.esperandoRespuesta && (
                    <span className="text-[10px] font-bold uppercase bg-primary text-white px-1.5 py-0.5 rounded">
                      sin responder
                    </span>
                  )}
                  {c.estado === "paused" && (
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      la llevas tú
                    </span>
                  )}
                  {c.escalado && (
                    <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      escalado
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Hilo */}
      <section className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-w-0">
        {error && (
          <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border-b border-red-200 p-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-xs underline shrink-0">
              cerrar
            </button>
          </div>
        )}

        {!detalle ? (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-8 text-center">
            Elige una conversación para leerla y responder.
          </div>
        ) : (
          <>
            <header className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <IconoCanal canal={detalle.canal} size={18} />
                  <h2 className="font-bold truncate">{detalle.nombre ?? detalle.waId}</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detalle.waId}
                  {detalle.lead?.crmId && (
                    <>
                      {" · "}
                      <Link
                        href="/admin/leads"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        lead #{detalle.lead.crmId} en el CRM <ExternalLink size={11} />
                      </Link>
                    </>
                  )}
                </p>
              </div>
              {detalle.estado === "paused" ? (
                <button
                  onClick={() => void devolver()}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Devolver al asistente
                </button>
              ) : (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
                  <Bot size={14} /> Lo lleva el asistente
                </span>
              )}
              <button
                onClick={() => setBorrando((v) => !v)}
                title="Borrar la conversación por completo"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Eraser size={16} />
              </button>
            </header>

            {borrando && (
              <div className="bg-red-50 border-b border-red-200 p-4 space-y-3">
                <div className="flex gap-2 items-start">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-bold">Borrar toda la conversación con {detalle.nombre ?? detalle.waId}</p>
                    <p className="text-xs mt-1">
                      Se van los {detalle.mensajes.length} mensajes y la ficha con sus datos. Si
                      viene de un lead, vuelve a la cola como si nunca se le hubiera escrito.{" "}
                      <strong>No se puede deshacer.</strong>
                    </p>
                    <p className="text-xs mt-1">
                      <strong>El gasto sí se conserva.</strong> Los tokens ya se consumieron, así
                      que el costo sigue contando en Actividad, pero sin nada que identifique a
                      esta persona.
                    </p>
                    <p className="text-xs mt-1">
                      Los mensajes seguirán en el WhatsApp de la persona: esto borra lo que sabe
                      el asistente, no lo que ella ya recibió.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void limpiar()}
                    placeholder="Tu contraseña del panel"
                    className="flex-1 rounded-lg border border-red-300 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                  <button
                    onClick={() => void limpiar()}
                    disabled={borrandoAhora || !clave}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
                  >
                    {borrandoAhora ? "Borrando…" : "Borrar"}
                  </button>
                  <button
                    onClick={() => { setBorrando(false); setClave(""); }}
                    className="px-4 py-2 rounded-lg border border-border text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {detalle.estado === "paused" && (
              <p className="text-xs bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2">
                El asistente está en pausa en esta conversación. No va a responder hasta que se lo
                devuelvas.
              </p>
            )}

            {detalle.escalado && detalle.motivoEscalamiento && (
              <p className="text-xs bg-red-50 border-b border-red-200 text-red-800 px-4 py-2">
                Escalado: {detalle.motivoEscalamiento}
              </p>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detalle.ficha && (
                <details className="bg-muted/50 border border-border rounded-xl p-3 text-xs">
                  <summary className="cursor-pointer font-bold uppercase tracking-wider text-muted-foreground">
                    De qué va la conversación
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-secondary/80">{detalle.ficha}</p>
                </details>
              )}

              {detalle.mensajes.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.de === "cliente" ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      m.de === "cliente"
                        ? "bg-muted rounded-tl-sm"
                        : m.de === "persona"
                          ? "bg-amber-100 text-amber-950 rounded-tr-sm"
                          : "bg-primary/10 rounded-tr-sm",
                    )}
                  >
                    {m.de !== "cliente" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                        {m.de === "persona" ? (
                          <>
                            <User size={10} /> Tu equipo
                          </>
                        ) : (
                          <>
                            <Bot size={10} /> Asistente
                          </>
                        )}
                      </span>
                    )}
                    <p className="whitespace-pre-line break-words">{m.texto}</p>
                    <span className="block text-[10px] opacity-50 mt-1 text-right">{hora(m.at)}</span>
                  </div>
                </div>
              ))}

              {detalle.acciones.length > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lo que se hizo en esta conversación
                  </p>
                  {detalle.acciones.map((a, i) => (
                    <p key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {ICONO_ACCION[a.tipo] ?? <MessageSquarePlus size={14} />}
                      {TEXTO_ACCION[a.tipo] ?? a.tipo}
                      <span className="opacity-60">· {cuando(a.at)}</span>
                    </p>
                  ))}
                </div>
              )}

              <div ref={finHilo} />
            </div>

            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void enviar();
                    }
                  }}
                  placeholder="Escribe para responder tú mismo…"
                  className="flex-1 resize-none rounded-xl border border-border p-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => void enviar()}
                  disabled={enviando || !texto.trim()}
                  className="shrink-0 h-[62px] w-[62px] grid place-items-center rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  <Send size={18} className={enviando ? "animate-pulse" : ""} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Al responder tú, el asistente se calla en esta conversación hasta que se lo
                devuelvas.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
