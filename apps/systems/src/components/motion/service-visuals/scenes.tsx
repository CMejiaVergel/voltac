"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Stage, Panel, Bar, useStage, LOOP_EASE } from "./stage";

/* ------------------------------------------------------------------ *
 * 01 · Diagnóstico: un barrido recorre las tareas de la operación y
 *      va marcando cuántas horas se lleva cada una.
 * ------------------------------------------------------------------ */
export function DiagnosticoScene() {
  const { ref, play, reduced } = useStage();
  const rows = [
    { w: 86, hours: "6 h" },
    { w: 62, hours: "4 h" },
    { w: 94, hours: "9 h" },
    { w: 54, hours: "2 h" },
  ];
  const CYCLE = 4;

  return (
    <Stage stageRef={ref}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Panel className="w-[216px] p-3.5 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <Bar w={52} h={3} />
          </div>

          <div className="space-y-2.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <motion.span
                  className="block rounded-full"
                  style={{ height: 4 }}
                  animate={
                    play
                      ? {
                          width: [row.w, row.w],
                          backgroundColor: [
                            "rgba(10,15,30,0.15)",
                            "rgba(10,15,30,0.15)",
                            "rgba(37,99,235,0.75)",
                            "rgba(37,99,235,0.75)",
                            "rgba(10,15,30,0.15)",
                          ],
                        }
                      : { width: row.w, backgroundColor: reduced ? "rgba(37,99,235,0.75)" : "rgba(10,15,30,0.15)" }
                  }
                  transition={{
                    duration: CYCLE,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.12 + i * 0.11, 0.2 + i * 0.11, 0.88, 1],
                  }}
                />
                <motion.span
                  className="ml-auto text-[8px] font-bold text-primary tabular-nums"
                  animate={play ? { opacity: [0, 0, 1, 1, 0] } : { opacity: reduced ? 1 : 0 }}
                  transition={{
                    duration: CYCLE,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.14 + i * 0.11, 0.24 + i * 0.11, 0.88, 1],
                  }}
                >
                  {row.hours}
                </motion.span>
              </div>
            ))}
          </div>

          {/* Haz de barrido */}
          {play && (
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ height: 26 }}
              animate={{ y: [6, 112] }}
              transition={{ duration: CYCLE, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full bg-gradient-to-b from-transparent via-primary/12 to-transparent" />
              <div className="w-full h-px bg-primary/50 -mt-px" />
            </motion.div>
          )}
        </Panel>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 02 · Automatización: documentos sueltos entran a un proceso y salen
 *      convertidos en registros ordenados.
 * ------------------------------------------------------------------ */
export function AutomatizacionScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 3;

  return (
    <Stage stageRef={ref}>
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {/* Entrada: documentos desordenados */}
        <div className="relative w-[52px] h-[64px]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-x-0 top-0 h-[52px] bg-white border border-border/70 rounded-md shadow-sm p-1.5 space-y-1"
              style={{ rotate: i * 5 - 5 }}
              animate={play ? { x: [0, 76], opacity: [1, 1, 0], scale: [1, 0.85] } : { x: 0, opacity: 1 }}
              transition={{ duration: CYCLE, repeat: Infinity, delay: i * (CYCLE / 3), ease: LOOP_EASE }}
            >
              <Bar w="80%" h={2.5} />
              <Bar w="60%" h={2.5} />
              <Bar w="70%" h={2.5} />
            </motion.div>
          ))}
        </div>

        {/* Núcleo de proceso */}
        <div className="relative shrink-0">
          {play && (
            <motion.span
              className="absolute inset-0 rounded-xl border border-primary/40"
              animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
              transition={{ duration: CYCLE / 3, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <motion.span
              className="block w-3.5 h-3.5 rounded-[3px] border-2 border-white"
              animate={play ? { rotate: [0, 90, 180, 270, 360] } : { rotate: 0 }}
              transition={{ duration: CYCLE, repeat: Infinity, ease: LOOP_EASE }}
            />
          </div>
        </div>

        {/* Salida: registros ordenados */}
        <Panel className="w-[74px] p-2 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5"
              animate={play ? { opacity: [0, 0, 1, 1] } : { opacity: reduced ? 1 : 0 }}
              transition={{
                duration: CYCLE,
                repeat: Infinity,
                delay: i * (CYCLE / 3),
                times: [0, 0.5, 0.62, 1],
                ease: LOOP_EASE,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="w-[3px] h-[3px] rounded-full bg-primary" />
              </span>
              <Bar w={i === 1 ? 34 : 42} h={3} className="!bg-secondary/20" />
            </motion.div>
          ))}
        </Panel>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 03 · Atención 24 h: una conversación real de WhatsApp que avanza
 *      sola — el cliente pregunta, el asistente responde y agenda.
 * ------------------------------------------------------------------ */
export function AtencionScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 7;

  const messages = [
    { from: "client", text: "Buenas, ¿tienen disponibilidad?", w: 118 },
    { from: "bot", text: "Sí. ¿Para qué fecha la necesita?", w: 116 },
    { from: "client", text: "El viernes en la mañana", w: 96 },
    { from: "bot", text: "Listo, agendado 9:00 a.m. ✓", w: 112 },
  ];

  // Cada mensaje entra en su turno y la columna sube para dejarlo a la vista.
  const step = 1 / (messages.length + 1);

  return (
    <Stage stageRef={ref} perspective={700}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[190px] h-[124px] rounded-xl overflow-hidden border border-border/70 bg-white shadow-[0_4px_14px_rgba(10,15,30,0.08)]"
          style={{ transform: "rotateY(-6deg) rotateX(3deg)" }}
        >
          {/* Cabecera del chat */}
          <div className="h-[22px] bg-[#075E54] flex items-center gap-1.5 px-2">
            <span className="w-3 h-3 rounded-full bg-white/30" />
            <span className="flex flex-col gap-[2px]">
              <span className="block w-8 h-[3px] rounded-full bg-white/70" />
              <span className="block w-5 h-[2px] rounded-full bg-[#25D366]" />
            </span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#25D366] soft-pulse" />
          </div>

          {/* Hilo */}
          <div className="relative h-[102px] bg-[#ECE5DD] overflow-hidden px-2 pt-2">
            <motion.div
              className="space-y-1.5"
              animate={play ? { y: [0, 0, -14, -30, -46] } : { y: reduced ? -46 : 0 }}
              transition={{
                duration: CYCLE,
                repeat: Infinity,
                times: [0, step, step * 2, step * 3, 1],
                ease: LOOP_EASE,
              }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex ${msg.from === "bot" ? "justify-end" : "justify-start"}`}
                  animate={
                    play
                      ? { opacity: [0, 0, 1, 1], scale: [0.9, 0.9, 1, 1] }
                      : { opacity: reduced ? 1 : 0, scale: 1 }
                  }
                  transition={{
                    duration: CYCLE,
                    repeat: Infinity,
                    times: [0, step * i + 0.02, step * i + 0.09, 1],
                    ease: LOOP_EASE,
                  }}
                >
                  <span
                    className={`block rounded-md px-1.5 py-1 text-[6px] leading-[1.4] font-medium ${
                      msg.from === "bot"
                        ? "bg-[#DCF8C6] text-secondary/70"
                        : "bg-white text-secondary/60"
                    }`}
                    style={{ maxWidth: msg.w }}
                  >
                    {msg.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Indicador de escritura entre respuestas */}
            {play && (
              <motion.div
                className="absolute bottom-2 right-2 bg-[#DCF8C6] rounded-md px-1.5 py-1 flex gap-[3px]"
                animate={{ opacity: [0, 1, 1, 0, 0] }}
                transition={{
                  duration: CYCLE,
                  repeat: Infinity,
                  times: [0, step * 0.5, step * 0.9, step * 1.05, 1],
                  ease: "linear",
                }}
              >
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="w-[3px] h-[3px] rounded-full bg-secondary/40"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 04 · Programas a la medida: una herramienta que se arma pieza por
 *      pieza, en perspectiva, como se construye un sistema propio.
 * ------------------------------------------------------------------ */
export function SoftwareScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 5;

  const pop = (i: number) => ({
    animate: play
      ? { opacity: [0, 0, 1, 1, 1], scale: [0.85, 0.85, 1, 1, 1] }
      : { opacity: reduced ? 1 : 0, scale: 1 },
    transition: {
      duration: CYCLE,
      repeat: Infinity,
      times: [0, 0.08 + i * 0.08, 0.18 + i * 0.08, 0.9, 1],
      ease: LOOP_EASE,
    },
  });

  return (
    <Stage stageRef={ref} perspective={800}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[212px] rounded-lg overflow-hidden bg-white border border-border/70 shadow-[0_10px_24px_rgba(10,15,30,0.12)]"
          style={{ transform: "rotateX(14deg) rotateZ(-6deg)", transformStyle: "preserve-3d" }}
        >
          {/* Barra de ventana */}
          <div className="h-[14px] bg-secondary flex items-center gap-1 px-2">
            {["bg-white/25", "bg-white/25", "bg-white/25"].map((c, i) => (
              <span key={i} className={`w-1 h-1 rounded-full ${c}`} />
            ))}
          </div>

          <div className="flex" style={{ height: 96 }}>
            {/* Menú lateral */}
            <div className="w-[42px] bg-muted border-r border-border/60 p-1.5 space-y-1.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div key={i} className="flex items-center gap-1" {...pop(i)}>
                  <span className={`w-1.5 h-1.5 rounded-[2px] ${i === 0 ? "bg-primary" : "bg-secondary/20"}`} />
                  <Bar w={i === 0 ? 20 : 24} h={2} />
                </motion.div>
              ))}
            </div>

            {/* Contenido */}
            <div className="flex-1 p-2 space-y-2">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded border border-border/60 bg-muted/60 p-1 space-y-1"
                    {...pop(i + 4)}
                  >
                    <Bar w="70%" h={2} />
                    <span className="block text-[7px] font-black text-primary leading-none">
                      {["24", "8", "96"][i]}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Gráfico */}
              <motion.div
                className="rounded border border-border/60 bg-muted/40 p-1.5 flex items-end gap-[3px]"
                style={{ height: 46 }}
                {...pop(7)}
              >
                {[40, 62, 34, 78, 52, 88].map((h, i) => (
                  /* La altura marca la proporción de la barra; scaleY hace el
                     crecimiento, que es lo que el navegador compone en GPU. */
                  <motion.span
                    key={i}
                    className="flex-1 rounded-sm bg-primary/70"
                    style={{ height: `${h}%`, transformOrigin: "bottom" }}
                    animate={play ? { scaleY: [0, 0, 1, 1] } : { scaleY: 1 }}
                    transition={{
                      duration: CYCLE,
                      repeat: Infinity,
                      times: [0, 0.55 + i * 0.03, 0.68 + i * 0.03, 1],
                      ease: LOOP_EASE,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 05 · Información para decidir: datos regados en varias fuentes que
 *      se reúnen en un solo tablero confiable.
 * ------------------------------------------------------------------ */
export function InformacionScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 4.5;
  const sources = ["Correo", "Excel", "Sistema"];

  return (
    <Stage stageRef={ref}>
      <div className="absolute inset-0 flex items-center justify-center gap-0">
        {/* Fuentes dispersas */}
        <div className="space-y-2 z-10">
          {sources.map((label, i) => (
            <motion.div
              key={label}
              className="bg-white border border-border/70 rounded px-1.5 py-1 text-[6px] font-bold uppercase tracking-wider text-secondary/45 shadow-sm"
              animate={play ? { x: [0, 3, 0] } : { x: 0 }}
              transition={{ duration: CYCLE, repeat: Infinity, delay: i * 0.3, ease: LOOP_EASE }}
            >
              {label}
            </motion.div>
          ))}
        </div>

        {/* Cauces que convergen */}
        <svg width="56" height="80" viewBox="0 0 56 80" fill="none" className="shrink-0">
          {[16, 40, 64].map((y, i) => (
            <g key={y}>
              <path
                d={`M0 ${y} C 26 ${y}, 30 40, 56 40`}
                stroke="rgba(10,15,30,0.10)"
                strokeWidth="1"
                fill="none"
              />
              {play && (
                <motion.path
                  d={`M0 ${y} C 26 ${y}, 30 40, 56 40`}
                  stroke="#2563eb"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="10 60"
                  animate={{ strokeDashoffset: [70, 0] }}
                  transition={{ duration: CYCLE / 2, repeat: Infinity, delay: i * 0.35, ease: "linear" }}
                />
              )}
            </g>
          ))}
        </svg>

        {/* Tablero único */}
        <Panel className="w-[86px] p-2 space-y-1.5 z-10">
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-[13px] font-black text-secondary leading-none tabular-nums"
              animate={play ? { opacity: [0.35, 1, 1, 0.35] } : { opacity: 1 }}
              transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.35, 0.85, 1], ease: LOOP_EASE }}
            >
              96
            </motion.span>
            <span className="text-[7px] font-bold text-primary">%</span>
          </div>
          <div className="flex items-end gap-[3px]" style={{ height: 32 }}>
            {[45, 70, 55, 88, 62].map((h, i) => (
              <motion.span
                key={i}
                className="flex-1 rounded-sm bg-primary/60"
                style={{ height: `${h}%`, transformOrigin: "bottom" }}
                animate={play ? { scaleY: [0.25, 1, 1, 0.25] } : { scaleY: reduced ? 1 : 0.25 }}
                transition={{
                  duration: CYCLE,
                  repeat: Infinity,
                  times: [0, 0.4 + i * 0.04, 0.85, 1],
                  ease: LOOP_EASE,
                }}
              />
            ))}
          </div>
        </Panel>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 06 · Presencia digital: alguien busca, encuentra la página y esa
 *      visita se convierte en una solicitud concreta.
 * ------------------------------------------------------------------ */
export function PresenciaScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 5;

  return (
    <Stage stageRef={ref}>
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {/* Navegador con resultados */}
        <div className="relative">
          <Panel className="w-[124px] overflow-hidden">
            <div className="h-[13px] bg-muted border-b border-border/60 flex items-center gap-1 px-1.5">
              <span className="w-1 h-1 rounded-full bg-secondary/20" />
              <span className="flex-1 h-[5px] rounded-full bg-white border border-border/60" />
            </div>
            <div className="p-1.5 space-y-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="rounded px-1 py-1 space-y-1"
                  animate={
                    play && i === 1
                      ? { backgroundColor: ["rgba(37,99,235,0)", "rgba(37,99,235,0)", "rgba(37,99,235,0.08)", "rgba(37,99,235,0.08)", "rgba(37,99,235,0)"] }
                      : {}
                  }
                  transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.25, 0.35, 0.9, 1], ease: LOOP_EASE }}
                >
                  <Bar w={i === 1 ? 62 : 48} h={3} className={i === 1 ? "!bg-primary/60" : undefined} />
                  <Bar w={i === 1 ? 88 : 70} h={2} />
                </motion.div>
              ))}
            </div>
          </Panel>

          {/* Cursor que se acerca y hace clic */}
          {play && (
            <motion.svg
              width="11"
              height="13"
              viewBox="0 0 11 13"
              className="absolute drop-shadow"
              animate={{ x: [78, 44, 44, 78], y: [66, 34, 34, 66], scale: [1, 1, 0.82, 1] }}
              transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.28, 0.34, 1], ease: LOOP_EASE }}
            >
              <path d="M0 0 L0 12 L3.2 9 L5.4 13 L7.4 12 L5.2 8 L9.6 8 Z" fill="#0a0f1e" />
            </motion.svg>
          )}
        </div>

        {/* Solicitudes que entran */}
        <div className="space-y-1.5 w-[70px]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5 bg-white border border-border/70 rounded px-1.5 py-1 shadow-sm"
              animate={
                play
                  ? { opacity: [0, 0, 1, 1, 0], x: [12, 12, 0, 0, 0] }
                  : { opacity: reduced ? 1 : 0, x: 0 }
              }
              transition={{
                duration: CYCLE,
                repeat: Infinity,
                times: [0, 0.42 + i * 0.09, 0.52 + i * 0.09, 0.92, 1],
                ease: LOOP_EASE,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="w-[3px] h-[3px] rounded-full bg-primary" />
              </span>
              <span className="text-[6px] font-bold uppercase tracking-wider text-secondary/45">
                Solicitud
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ *
 * 07 · Operaciones y cumplimiento: sensores en planta que transmiten
 *      solos y un reporte que sale a tiempo.
 * ------------------------------------------------------------------ */
export function OperacionesScene() {
  const { ref, play, reduced } = useStage();
  const CYCLE = 4;

  return (
    <Stage stageRef={ref} perspective={700}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        {/* Lectura en vivo */}
        <Panel className="w-[168px] px-2.5 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[6px] font-bold uppercase tracking-wider text-secondary/40">
              En planta
            </span>
            <motion.span
              className="text-[7px] font-black text-primary tabular-nums"
              animate={play ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
              transition={{ duration: CYCLE / 2, repeat: Infinity, ease: "easeInOut" }}
            >
              en vivo
            </motion.span>
          </div>

          {/* Onda de telemetría */}
          <svg width="100%" height="26" viewBox="0 0 148 26" fill="none" preserveAspectRatio="none">
            <path
              d="M0 18 L18 18 L24 8 L30 22 L36 13 L48 13 L54 4 L60 20 L68 13 L86 13 L92 6 L98 21 L104 14 L124 14 L130 9 L136 18 L148 18"
              stroke="rgba(10,15,30,0.10)"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="round"
            />
            {play && (
              <motion.path
                d="M0 18 L18 18 L24 8 L30 22 L36 13 L48 13 L54 4 L60 20 L68 13 L86 13 L92 6 L98 21 L104 14 L124 14 L130 9 L136 18 L148 18"
                stroke="#2563eb"
                strokeWidth="1.6"
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="40 220"
                animate={{ strokeDashoffset: [260, 0] }}
                transition={{ duration: CYCLE, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>
        </Panel>

        {/* Piso de planta con sensores */}
        <div
          className="flex items-end gap-1.5"
          style={{ transform: "rotateX(28deg)", transformStyle: "preserve-3d" }}
        >
          {[16, 24, 18, 28, 20].map((h, i) => (
            <div key={i} className="relative flex flex-col items-center">
              {play && (
                <motion.span
                  className="absolute -top-1 w-1 h-1 rounded-full bg-accent"
                  animate={{ y: [0, -10], opacity: [0, 1, 0] }}
                  transition={{ duration: CYCLE / 2, repeat: Infinity, delay: i * 0.28, ease: "easeOut" }}
                />
              )}
              <span
                className="w-3 rounded-t-sm bg-secondary/20 border-t border-x border-border/60"
                style={{ height: h }}
              />
            </div>
          ))}
        </div>

        {/* Reporte entregado a tiempo */}
        <motion.div
          className="flex items-center gap-1 bg-white border border-primary/25 rounded-full px-2 py-[3px] shadow-sm"
          animate={play ? { opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 0] } : { opacity: reduced ? 1 : 0, y: 0 }}
          transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.55, 0.68, 0.92, 1], ease: LOOP_EASE }}
        >
          <span className="w-2 h-2 rounded-full bg-primary flex items-center justify-center">
            <svg width="5" height="4" viewBox="0 0 6 5" fill="none">
              <path d="M1 2.6 L2.3 3.9 L5 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[6px] font-bold uppercase tracking-wider text-secondary/55">
            Reporte enviado
          </span>
        </motion.div>
      </div>
    </Stage>
  );
}
