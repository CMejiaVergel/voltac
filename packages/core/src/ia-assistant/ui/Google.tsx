"use client";

import * as React from "react";
import { AlertTriangle, CalendarDays, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../utils";
import { cargarGoogle } from "../acciones-avanzadas";
import type { EstadoGoogle } from "../cliente";

/**
 * Conectar Google Workspace desde el panel.
 *
 * Va junto a la línea de WhatsApp porque son las dos mismas cosas: conexiones
 * externas que caducan solas y que hasta ahora solo se podían rehacer entrando
 * por SSH al servidor. La de Google además necesitaba un túnel, porque el
 * asistente escucha en loopback y el navegador no lo alcanza.
 *
 * Muestra **qué cuenta** está conectada, no solo que lo está. Con el calendario
 * en `primary` las reuniones caen en la agenda de esa cuenta, y si las dos
 * líneas de negocio autorizaran la misma, todas las citas acabarían mezcladas
 * sin que nada lo advirtiera.
 */
export function Google() {
  const [g, setG] = React.useState<EstadoGoogle | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState("");
  const [copiado, setCopiado] = React.useState(false);

  const refrescar = React.useCallback(async () => {
    const r = await cargarGoogle();
    setCargando(false);
    if (r.ok && r.datos) {
      setG(r.datos);
      setError("");
    } else {
      setError(r.error ?? "No se pudo consultar el estado de Google.");
    }
  }, []);

  React.useEffect(() => {
    void refrescar();
  }, [refrescar]);

  /*
   * Al volver a esta pestaña, comprobar de nuevo.
   *
   * La autorización ocurre en OTRA pestaña, así que esta no se entera de nada:
   * la persona autoriza, vuelve, y sigue leyendo "Sin conectar" hasta que
   * recarga a mano. Es el momento exacto en que uno cree que no funcionó.
   */
  React.useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === "visible") void refrescar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [refrescar]);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin portapapeles: la dirección está a la vista igual */
    }
  }

  if (cargando) {
    return (
      <section className="bg-card border border-border rounded-xl p-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" />
        Consultando Google Workspace…
      </section>
    );
  }

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Google Workspace</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            El calendario donde el asistente consulta disponibilidad y agenda las reuniones.
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shrink-0",
            g?.conectado
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-amber-50 border-amber-200 text-amber-800",
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {g?.conectado ? "Conectado" : "Sin conectar"}
        </span>
      </div>

      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {g?.conectado && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-secondary text-sm truncate">
              {g.cuenta ?? "Cuenta conectada"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Calendario <span className="font-mono">{g.calendario}</span> · {g.zona}
            </div>
          </div>
        </div>
      )}

      {g?.conectado && g.calendario === "primary" && (
        <p className="text-[11px] text-muted-foreground leading-relaxed flex gap-1.5 items-start">
          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" />
          Con el calendario en <span className="font-mono">primary</span>, las reuniones caen en la agenda
          principal de esa cuenta. Si la otra línea de negocio usa la misma, las citas de las dos se mezclan.
          Para separarlas, crea un calendario aparte en Google y pon su identificador en{" "}
          <span className="font-mono">GOOGLE_CALENDAR_ID</span>.
        </p>
      )}

      {g?.motivo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900 leading-relaxed">
          {g.motivo}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border flex-wrap">
        <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
          {g?.conectado
            ? "Si el permiso caduca o hay que cambiar de cuenta, se vuelve a autorizar desde aquí."
            : "Sin esto el asistente no puede consultar disponibilidad ni agendar: la conversación llega hasta proponer la reunión y se queda ahí."}
        </p>
        {g?.urlConsentimiento && (
          <a
            href={g.urlConsentimiento}
            /* En pestaña nueva: autorizar en Google son varios pasos y a veces
               hay que cambiar de cuenta. Hacerlo en la misma pestaña obliga a
               abandonar la pantalla de configuración a medias, y si algo sale
               mal se pierde el sitio donde uno estaba. */
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <ExternalLink size={14} />
            {g.conectado ? "Volver a autorizar" : "Conectar Google"}
          </a>
        )}
      </div>

      {/* La dirección de retorno, siempre a la vista.
          `redirect_uri_mismatch` es el error con el que tropieza todo el mundo
          la primera vez, y se resuelve pegando exactamente esta cadena en
          Google Cloud Console. Tenerla que reconstruir a mano es donde se
          cuelan las diferencias de una barra o de http contra https. */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          URI de redirección autorizada
        </div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-[11px] font-mono text-secondary break-all flex-1">{g?.redirectUri}</code>
          <button
            type="button"
            onClick={() => g?.redirectUri && void copiar(g.redirectUri)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
          >
            <Copy size={11} />
            {copiado ? "Copiada" : "Copiar"}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          Tiene que estar registrada en Google Cloud Console, en el cliente OAuth, exactamente así. Si no, la
          autorización falla con <span className="font-mono">redirect_uri_mismatch</span>.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void refrescar()}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-secondary transition-colors"
      >
        <RefreshCw size={11} />
        Actualizar estado
      </button>
    </section>
  );
}
