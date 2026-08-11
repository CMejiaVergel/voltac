"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Link2Off,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { cn } from "../../utils";
import { cargarVinculacion, revincularLineaConfirmada } from "../acciones-avanzadas";
import type { Vinculacion as EstadoVinculacion } from "../cliente";

/**
 * Vincular la línea de WhatsApp desde el panel.
 *
 * Antes el QR solo salía por la terminal del servidor. Eso significa que
 * recuperar una sesión caída exige entrar por SSH, y una sesión de WhatsApp Web
 * se cae sola cada cierto tiempo —ya pasó una vez, un domingo—. Una operación
 * que hay que hacer con urgencia y sin aviso no puede depender de tener a mano
 * la clave del servidor.
 *
 * Mientras la pantalla está abierta y hay un QR vivo se consulta cada dos
 * segundos. WhatsApp rota el código cada veinte, así que uno de hace un minuto
 * ya no sirve; sin refresco automático la persona lo escanearía tres veces
 * creyendo que le falla la cámara.
 */

/** Con QR vivo hay que ir rápido: el código se renueva cada 20 segundos. */
const REFRESCO_QR_MS = 2_000;
/** Ya conectado no hay prisa: es solo para notar si se cae. */
const REFRESCO_TRANQUILO_MS = 15_000;

export function Vinculacion() {
  const [v, setV] = React.useState<EstadoVinculacion | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [confirmando, setConfirmando] = React.useState(false);
  const [clave, setClave] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [trabajando, setTrabajando] = React.useState(false);
  const [error, setError] = React.useState("");
  const [aviso, setAviso] = React.useState("");

  const refrescar = React.useCallback(async () => {
    const r = await cargarVinculacion();
    setCargando(false);
    if (r.ok && r.datos) {
      setV(r.datos);
      setError("");
    } else {
      setError(r.error ?? "No se pudo consultar el estado de la línea.");
    }
  }, []);

  React.useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const esperandoQr = v?.estado === "esperando-qr";

  React.useEffect(() => {
    const ms = esperandoQr ? REFRESCO_QR_MS : REFRESCO_TRANQUILO_MS;
    const t = setInterval(() => void refrescar(), ms);
    return () => clearInterval(t);
  }, [esperandoQr, refrescar]);

  async function desvincular() {
    setTrabajando(true);
    setError("");
    const r = await revincularLineaConfirmada(clave, motivo);
    setTrabajando(false);
    if (!r.ok) {
      setError(r.error ?? "No se pudo desvincular.");
      return;
    }
    setClave("");
    setMotivo("");
    setConfirmando(false);
    setAviso(
      "Línea desvinculada. En unos segundos aparece el QR nuevo aquí mismo. La sesión anterior quedó archivada en el servidor por si hay que volver atrás.",
    );
    void refrescar();
  }

  if (cargando) {
    return (
      <section className="bg-card border border-border rounded-xl p-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" />
        Consultando el estado de la línea…
      </section>
    );
  }

  if (v && !v.soportado) {
    return (
      <section className="bg-card border border-border rounded-xl p-5">
        <Encabezado />
        <p className="text-[12px] text-muted-foreground mt-3">{v.detalle}</p>
      </section>
    );
  }

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Encabezado />
        {v && <Insignia estado={v.estado} />}
      </div>

      {error && (
        <div className="flex gap-2 items-start text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {aviso && (
        <div className="flex gap-2 items-start text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          {aviso}
        </div>
      )}

      {v?.estado === "conectado" && <Conectada v={v} />}
      {esperandoQr && v && <Qr v={v} />}
      {(v?.estado === "iniciando" || v?.estado === "conectando") && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
          <Loader2 size={15} className="animate-spin" />
          Conectando con WhatsApp…
        </div>
      )}
      {(v?.estado === "desvinculado" || v?.estado === "caido") && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900 leading-relaxed">
          {v.detalle ?? "La línea no está conectada."}
        </div>
      )}

      {/* --- Desvincular ------------------------------------------------- */}
      {!confirmando ? (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border flex-wrap">
          <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
            {v?.estado === "conectado"
              ? "Para cambiar de línea o volver a parear después de un problema, hay que desvincular primero."
              : "Si el QR no aparece o quedó una sesión a medias, forzar un pareo nuevo lo resuelve."}
          </p>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors shrink-0"
          >
            <Link2Off size={14} />
            Desvincular y pedir QR nuevo
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <div className="flex gap-2 items-start">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-bold">Desvincular la línea de WhatsApp</p>
              <p className="text-xs mt-1">
                El asistente queda <strong>completamente mudo</strong> hasta que alguien escanee el QR nuevo. No
                recibe mensajes de clientes ni puede contestar los que ya llegaron. Esto afecta a todas las
                conversaciones a la vez, no a una.
              </p>
              <p className="text-xs mt-1">
                <strong>No se pierde nada más.</strong> El historial de conversaciones, los prospectos y el gasto
                en tokens siguen igual. La sesión anterior se archiva en el servidor, no se borra.
              </p>
              <p className="text-xs mt-1">
                Ten el teléfono a mano: <strong>WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo</strong>.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (queda en la auditoría). Ej: cambio a la línea de Energy"
            className="w-full rounded-lg border border-red-300 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />

          <div className="flex gap-2">
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && clave && void desvincular()}
              placeholder="Tu contraseña del panel"
              className="flex-1 rounded-lg border border-red-300 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button
              type="button"
              onClick={() => void desvincular()}
              disabled={trabajando || !clave}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              {trabajando ? "Desvinculando…" : "Desvincular"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmando(false);
                setClave("");
                setMotivo("");
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Encabezado() {
  return (
    <div>
      <h3 className="font-bold uppercase tracking-wider text-sm text-secondary">Línea de WhatsApp</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        Qué número tiene vinculado el asistente, y cómo cambiarlo sin entrar al servidor.
      </p>
    </div>
  );
}

const INSIGNIA: Record<string, { texto: string; clase: string }> = {
  conectado: { texto: "Conectada", clase: "bg-green-50 border-green-200 text-green-700" },
  "esperando-qr": { texto: "Esperando escaneo", clase: "bg-amber-50 border-amber-200 text-amber-800" },
  conectando: { texto: "Conectando", clase: "bg-blue-50 border-blue-200 text-blue-700" },
  iniciando: { texto: "Iniciando", clase: "bg-blue-50 border-blue-200 text-blue-700" },
  desvinculado: { texto: "Desvinculada", clase: "bg-red-50 border-red-200 text-red-700" },
  caido: { texto: "Sin conexión", clase: "bg-red-50 border-red-200 text-red-700" },
};

function Insignia({ estado }: { estado: string }) {
  const i = INSIGNIA[estado] ?? INSIGNIA.caido!;
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shrink-0",
        i.clase,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {i.texto}
    </span>
  );
}

function Conectada({ v }: { v: EstadoVinculacion }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
        <Smartphone size={18} />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-secondary text-sm">
          {v.numero ? `+${v.numero}` : "Número no informado"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {v.nombre && <span>{v.nombre} · </span>}
          {v.conectadoDesde
            ? `conectada desde ${new Date(v.conectadoDesde).toLocaleString("es-CO", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "sesión activa"}
        </div>
      </div>
      <Link2 size={16} className="text-green-600 ml-auto shrink-0" />
    </div>
  );
}

function Qr({ v }: { v: EstadoVinculacion }) {
  const quedan = v.qrValidoSeg ?? 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 rounded-lg border border-border bg-muted/20 p-4">
      <div className="shrink-0 bg-white rounded-lg p-2 border border-border">
        {v.qrImagen ? (
          <Image src={v.qrImagen} alt="Código QR para vincular WhatsApp" width={200} height={200} unoptimized />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground">
            <QrCode size={40} />
          </div>
        )}
      </div>

      <div className="text-sm space-y-2 min-w-0">
        <p className="font-bold text-secondary">Escanea este código con el teléfono de la línea</p>
        <ol className="text-[12px] text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
          <li>Abre WhatsApp en el teléfono</li>
          <li>
            Menú <strong>⋮</strong> → <strong>Dispositivos vinculados</strong>
          </li>
          <li>
            <strong>Vincular un dispositivo</strong>
          </li>
          <li>Apunta la cámara aquí</li>
        </ol>
        <p
          className={cn(
            "text-[11px] flex items-center gap-1.5",
            quedan <= 5 ? "text-amber-700" : "text-muted-foreground",
          )}
        >
          <RefreshCw size={11} className={cn(quedan <= 5 && "animate-spin")} />
          {quedan > 0
            ? `El código se renueva en ${quedan} s. Si se renueva mientras escaneas, espera al siguiente.`
            : "Generando un código nuevo…"}
        </p>
      </div>
    </div>
  );
}
