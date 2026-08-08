"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyticsTable({ events }: { events: any[] }) {
  const [filter, setFilter] = useState("");

  const filtered = events.filter(e => 
    (e.path?.includes(filter) || e.eventType?.includes(filter) || e.ip?.includes(filter))
  );

  const exportCSV = () => {
    if(!filtered.length) return;
    const headers = ["Timestamp", "IP (Anonymized)", "Event Type", "Path", "Duration (s)"];
    const csvContent = [
      headers.join(","),
      ...filtered.map(e => `"${new Date(e.timestamp).toLocaleString()}","${e.ip}","${e.eventType}","${e.path}",${e.duration||0}`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "voltac_logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-white rounded-2xl border border-border mt-8 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/5">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" size={16} />
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar logs..." 
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border w-64 outline-none focus:border-primary"
            />
         </div>
         <Button onClick={exportCSV} variant="outline" className="gap-2 text-primary border-primary hover:bg-primary/10">
            <Download size={16} /> Exportar CSV
         </Button>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-secondary/60 text-xs uppercase tracking-wider">
              <th className="p-4 border-b">Fecha/Hora</th>
              <th className="p-4 border-b">Dir IP</th>
              <th className="p-4 border-b">Tipo Evento</th>
              <th className="p-4 border-b">Ruta Visitada</th>
              <th className="p-4 border-b">Permanencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-secondary/40">No hay logs registrados. Navega por el frontend para generarlos.</td></tr>
            ) : filtered.map((e, idx) => (
              <tr key={idx} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium text-secondary/80">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="p-4 text-xs font-mono text-secondary/60 bg-muted/30">{e.ip}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${e.eventType==='page_view' ? 'bg-blue-100 text-blue-700' : e.eventType==='time_spent' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {e.eventType}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs">{e.path}</td>
                <td className="p-4">{e.duration ? e.duration + 's' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
