"use client";

import * as React from "react";
import { MessageCircle, Sparkles, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { prepararWhatsApp, enviarWhatsApp } from "../acciones";
import type { RespuestaPreview } from "../cliente";

/**
 * Contacto autorizado por WhatsApp.
 *
 * Es el permiso que se pide antes de que el asistente le escriba a nadie, y
 * está pensado como un permiso de verdad y no como un "¿seguro?": se muestra el
 * texto exacto que va a salir, se puede corregir, y lo que se envía es
 * literalmente lo que quedó en el cuadro. El asistente no vuelve a redactar en
 * el segundo paso.
 *
 * Nada de esto ocurre solo. No hay proceso automático que contacte prospectos:
 * cada mensaje sale de alguien pulsando este botón.
 *
 * Vive en el núcleo y no en una aplicación porque no es propio de ninguna marca:
 * pedir permiso antes de escribirle a un prospecto es de la plataforma. Nació en
 * `apps/systems` y por eso Energy se quedó sin él durante un tiempo, que es
 * justo el problema que se evita teniéndolo aquí.
 */
export default function WhatsAppContacto({ lead }: { lead: any }) {
  const [cargando, setCargando] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [previo, setPrevio] = React.useState<RespuestaPreview | null>(null);
  const [texto, setTexto] = React.useState("");
  const [error, setError] = React.useState("");
  const [enviado, setEnviado] = React.useState<string | null>(null);

  const sinTelefono = !lead.phone?.trim();

  // Cambiar de lead sin cerrar el modal dejaba el borrador del anterior en
  // pantalla, con el botón de enviar activo. Un mensaje escrito para otra
  // persona no se puede quedar a un clic de salir.
  React.useEffect(() => {
    setPrevio(null);
    setTexto("");
    setError("");
    setEnviado(null);
  }, [lead.id]);

  /*
   * El try/catch no es decoracion.
   *
   * Sin el, una accion de servidor que lanza deja este `await` rechazado, el
   * `setCargando(false)` no llega nunca, y el boton se queda en "Redactando…"
   * indefinidamente sin explicar nada. Paso: una consulta pedia una columna que
   * no existe en la tabla de Energy y el sintoma fue un boton colgado, que no
   * apunta a la causa por ningun lado.
   *
   * Un fallo tiene que verse como un fallo, aunque no sepamos cual.
   */
  const preparar = async () => {
    setCargando(true);
    setError("");
    setEnviado(null);
    try {
      const r = await prepararWhatsApp(lead.id);
      if (!r.ok || !r.datos) {
        setError(r.error ?? "No se pudo preparar el mensaje.");
        return;
      }
      setPrevio(r.datos);
      setTexto(r.datos.borrador ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Falló al preparar el mensaje: ${err.message}`
          : "Falló al preparar el mensaje.",
      );
    } finally {
      setCargando(false);
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setError("");
    try {
      const r = await enviarWhatsApp(lead.id, texto);
      if (!r.ok) {
        setError(r.error ?? "No se pudo enviar.");
        return;
      }
      setEnviado(r.datos?.mensaje ?? texto);
      setPrevio(null);
    } catch (err) {
      // Aqui colgarse seria peor todavia: no se sabria si el mensaje salio.
      setError(
        err instanceof Error
          ? `Falló el envío: ${err.message}. Revisa la conversación antes de reintentar, por si alcanzó a salir.`
          : "Falló el envío.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-secondary text-lg uppercase tracking-wider flex items-center gap-2">
          <MessageCircle size={18} className="text-green-600" />
          Asistente de WhatsApp
        </h3>
        {previo?.lead?.puntaje !== undefined && (
          <span
            className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
              previo.lead.prioridad === "alta"
                ? "bg-green-100 text-green-700"
                : previo.lead.prioridad === "media"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-muted text-secondary/60"
            }`}
          >
            {previo.lead.prioridad} · {previo.lead.puntaje}
          </span>
        )}
      </div>

      {sinTelefono ? (
        <p className="text-sm text-secondary/60 italic">
          Este lead no dejó número de WhatsApp, así que el asistente no puede escribirle.
        </p>
      ) : (
        <>
          {/* Qué pasó con la factura que subió en el formulario. Va antes del
              borrador porque cambia cómo hay que leerlo: un mensaje redactado
              sin datos de consumo no es el mismo mensaje. */}
          {previo?.recibo && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                previo.recibo.leido
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}
            >
              {previo.recibo.leido ? (
                <>
                  <span className="font-semibold">Factura leída.</span> El asistente ya tiene los
                  datos de consumo.
                  {previo.recibo.faltantes?.length ? (
                    <> No se alcanzó a leer: {previo.recibo.faltantes.join(", ")}.</>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="font-semibold">No se pudo leer la factura.</span>{" "}
                  {previo.recibo.motivo} El asistente va a escribir sin datos de consumo y tendrá
                  que pedírselos en la conversación.
                </>
              )}
            </div>
          )}

          {/* Por qué el asistente le da esa prioridad. Se muestra en lenguaje
              claro a propósito: un puntaje que no se puede discutir no sirve
              para decidir a quién se llama primero. */}
          {previo?.lead?.senales && previo.lead.senales.length > 0 && (
            <ul className="text-xs text-secondary/60 space-y-1">
              {previo.lead.senales.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">·</span>
                  {s}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {enviado && (
            <div className="space-y-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex gap-2 items-center font-semibold">
                <CheckCircle2 size={16} /> Mensaje enviado
              </div>
              <p className="whitespace-pre-line text-secondary/70 text-xs">{enviado}</p>
            </div>
          )}

          {previo && !previo.puedeContactar && (
            <p className="text-sm text-secondary/70 bg-muted rounded-xl p-3">{previo.motivo}</p>
          )}

          {previo?.puedeContactar && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-secondary/60 uppercase block mb-2">
                  Mensaje que se va a enviar
                  {previo.toque && previo.toque > 1 && ` · seguimiento ${previo.toque} de 3`}
                </label>
                <textarea
                  rows={7}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="w-full resize-none rounded-xl border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-secondary/50 mt-1">
                  Puede corregirlo. Se envía exactamente lo que quede aquí.
                </p>
              </div>
              <button
                type="button"
                onClick={enviar}
                disabled={enviando || !texto.trim()}
                className="w-full inline-flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold h-10 px-4 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Send size={16} className={`mr-2 ${enviando ? "animate-pulse" : ""}`} />
                {enviando ? "Enviando…" : "Autorizar y enviar por WhatsApp"}
              </button>
            </div>
          )}

          {!previo && (
            <button
              type="button"
              onClick={preparar}
              disabled={cargando}
              className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold h-10 px-4 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Sparkles size={16} className={`mr-2 ${cargando ? "animate-pulse" : ""}`} />
              {cargando ? "Redactando…" : enviado ? "Preparar otro mensaje" : "Preparar mensaje"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
