"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import type { AnalyticsEvent } from "./types";

/**
 * Tabla de eventos del panel de analítica.
 *
 * Leía `timestamp`, `ip` y `eventType`: los nombres del formato anterior, el de
 * las líneas JSON. Al pasar la analítica a SQLite las columnas quedaron como
 * `at`, `ipHash` y `event`, y esto siguió compilando porque los eventos venían
 * tipados como `any`. El resultado era una tabla que se veía bien —las fechas
 * decían "Invalid Date"— y un filtro que no encontraba nada.
 *
 * Ahora recibe el tipo real, así que un cambio de columna se nota al compilar.
 */
export function AnalyticsTable({ events }: { events: AnalyticsEvent[] }) {
  const [filter, setFilter] = useState("");

  const texto = filter.trim().toLowerCase();
  const filtered = texto
    ? events.filter((e) =>
        [e.path, e.event, e.referrer].some((v) => v?.toLowerCase().includes(texto)),
      )
    : events;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Fecha", "Evento", "Ruta", "Procedencia", "Permanencia (s)"];
    const csv = [
      headers.join(","),
      ...filtered.map((e) =>
        [e.at, e.event, e.path ?? "", e.referrer ?? "", e.duration || 0]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    // El BOM hace que Excel abra el archivo como UTF-8; sin él, las tildes de
    // las rutas y las procedencias salen rotas.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voltac-analitica-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-border mt-8 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-wrap gap-3 justify-between items-center bg-secondary/5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40"
            size={16}
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por ruta, evento o procedencia…"
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border w-72 outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors px-4 py-2 text-sm font-medium"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-secondary/60 text-xs uppercase tracking-wider">
              <th className="p-4 border-b">Fecha/Hora</th>
              <th className="p-4 border-b">Evento</th>
              <th className="p-4 border-b">Ruta visitada</th>
              <th className="p-4 border-b">Procedencia</th>
              <th className="p-4 border-b">Permanencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-secondary/40">
                  {events.length === 0
                    ? "Todavía no hay visitas registradas."
                    : "Ningún evento coincide con el filtro."}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium text-secondary/80 whitespace-nowrap">{e.at}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        e.event === "page_view"
                          ? "bg-blue-100 text-blue-700"
                          : e.event === "time_spent"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {e.event}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs">{e.path}</td>
                  <td className="p-4 text-xs text-secondary/60 max-w-[220px] truncate">
                    {e.referrer || "directa"}
                  </td>
                  <td className="p-4">{e.duration ? e.duration + "s" : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
