"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, ArrowRight, FileCheck, FileDown } from "lucide-react";
import { cn } from "../../../utils";
import { QuoteModal } from "./components/QuoteModal";

const STATUSES = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Vencida", "Convertida"] as const;
type Status = typeof STATUSES[number];

const STATUS_COLORS: Record<Status, string> = {
  "Borrador":    "bg-gray-100 text-gray-600 border-gray-200",
  "Enviada":     "bg-blue-100 text-blue-700 border-blue-200",
  "Aceptada":    "bg-green-100 text-green-700 border-green-200",
  "Rechazada":   "bg-red-100 text-red-500 border-red-200",
  "Vencida":     "bg-orange-100 text-orange-700 border-orange-200",
  "Convertida":  "bg-purple-100 text-purple-700 border-purple-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);

export default function CotizacionesPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [converting, setConverting] = useState<number | null>(null);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounting/quotes");
      const j = await res.json();
      if (j.success) setQuotes(j.data.filter((q: any) => q.status !== "Anulada"));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchQuotes(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Anular esta cotización?")) return;
    await fetch(`/api/accounting/quotes/${id}`, { method: "DELETE" });
    fetchQuotes();
  };

  const handleConvert = async (id: number) => {
    if (!confirm("¿Convertir esta cotización en factura?")) return;
    setConverting(id);
    try {
      const res = await fetch(`/api/accounting/quotes/${id}/convert`, { method: "POST" });
      const j = await res.json();
      if (j.success) {
        alert(`✅ Factura ${j.data.invoice_number} creada exitosamente.`);
        fetchQuotes();
      } else alert("Error al convertir.");
    } finally { setConverting(null); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/accounting/quotes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchQuotes();
  };

  const filtered = quotes.filter(q =>
    q.number?.toLowerCase().includes(search.toLowerCase()) ||
    q.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = (status: Status) => filtered.filter((q) => q.status === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Cotizaciones</h2>
          <p className="text-muted-foreground text-sm mt-1">Generación y seguimiento de propuestas comerciales.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("kanban")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "kanban" ? "bg-secondary text-white" : "text-muted-foreground hover:bg-secondary/5")}>Kanban</button>
            <button onClick={() => setView("list")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "list" ? "bg-secondary text-white" : "text-muted-foreground hover:bg-secondary/5")}>Lista</button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Nueva Cotización
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input type="text" placeholder="Buscar por número o cliente..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Cargando cotizaciones...</div>
      ) : view === "kanban" ? (
        /* KANBAN VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.filter(s => s !== "Convertida").map((status) => (
            <div key={status} className="flex-shrink-0 w-72">
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border mb-3 text-sm font-semibold", STATUS_COLORS[status])}>
                <span>{status}</span>
                <span className="bg-white/60 rounded-full px-2 py-0.5 text-xs">{byStatus(status).length}</span>
              </div>
              <div className="space-y-3">
                {byStatus(status).length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">Sin cotizaciones</div>
                ) : byStatus(status).map((q) => (
                  <div key={q.id} className="bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-primary font-bold">{q.number}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingItem(q); setIsModalOpen(true); }} className="p-1 hover:bg-secondary/10 rounded text-secondary"><Edit size={13} /></button>
                        <button onClick={() => handleDelete(q.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1 truncate">{q.client_name}</p>
                    <p className="text-xs text-muted-foreground mb-3">Vence: {q.expiry_date?.slice(0, 10)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-primary">{fmt(q.total)}</span>
                    </div>
                    {status === "Aceptada" && (
                      <button onClick={() => handleConvert(q.id)} disabled={converting === q.id}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors disabled:opacity-60">
                        <FileCheck size={13} />{converting === q.id ? "Convirtiendo..." : "Convertir a Factura"}
                      </button>
                    )}
                    {status === "Borrador" && (
                      <div className="mt-3 flex gap-1.5">
                        <button onClick={() => handleStatusChange(q.id, "Enviada")}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 rounded-lg transition-colors">
                          Marcar Enviada
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Emisión</th>
                <th className="px-4 py-3 text-left">Vencimiento</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No hay cotizaciones.</td></tr>
              ) : filtered.map((q) => (
                <tr key={q.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{q.number}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{q.client_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.issue_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.expiry_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{fmt(q.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_COLORS[q.status as Status] || "")}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {q.status === "Aceptada" && (
                        <button onClick={() => handleConvert(q.id)} disabled={converting === q.id}
                          className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors" title="Convertir a Factura">
                          <ArrowRight size={15} />
                        </button>
                      )}
                      <a href={`/api/accounting/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer"
                        title="Descargar PDF" className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors">
                        <FileDown size={15} />
                      </a>
                      <button onClick={() => { setEditingItem(q); setIsModalOpen(true); }} className="p-1.5 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchQuotes} initialData={editingItem} />
    </div>
  );
}
