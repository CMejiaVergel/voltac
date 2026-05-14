"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Edit, Trash2, FileText } from "lucide-react";
import { InvoiceModal } from "./components/InvoiceModal";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Borrador": "bg-gray-100 text-gray-600",
  "Enviada": "bg-blue-100 text-blue-700",
  "Parcialmente pagada": "bg-amber-100 text-amber-700",
  "Pagada": "bg-green-100 text-green-700",
  "Vencida": "bg-red-100 text-red-700",
  "Anulada": "bg-red-50 text-red-400",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState<"emitted" | "received">("emitted");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounting/invoices?type=${activeTab}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data.filter((i: any) => i.status !== "Anulada"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas anular esta factura?")) return;
    await fetch(`/api/accounting/invoices/${id}`, { method: "DELETE" });
    fetchInvoices();
  };

  const filtered = invoices.filter(i =>
    i.number?.toLowerCase().includes(search.toLowerCase()) ||
    i.third_party_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary totals
  const totalAmount = filtered.reduce((a: number, i: any) => a + (i.total || 0), 0);
  const totalPaid = filtered.filter((i: any) => i.status === "Pagada").reduce((a: number, i: any) => a + (i.total || 0), 0);
  const totalPending = filtered.filter((i: any) => ["Enviada", "Parcialmente pagada", "Vencida"].includes(i.status)).reduce((a: number, i: any) => a + (i.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Facturación</h2>
          <p className="text-muted-foreground text-sm mt-1">Gestión de facturas emitidas y recibidas.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={16} /><span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} /><span className="hidden sm:inline">Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Facturado", value: fmt(totalAmount), color: "text-foreground" },
          { label: "Cobrado / Pagado", value: fmt(totalPaid), color: "text-green-600" },
          { label: "Pendiente", value: fmt(totalPending), color: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-background border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["emitted", "Emitidas"], ["received", "Recibidas"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => { setActiveTab(val); setSearch(""); }}
            className={cn("flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative", activeTab === val ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <FileText size={16} />{label}
            {activeTab === val && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input type="text" placeholder="Buscar por número o nombre..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Número</th>
              <th className="px-4 py-3 text-left">{activeTab === "emitted" ? "Cliente" : "Proveedor"}</th>
              <th className="px-4 py-3 text-left">Emisión</th>
              <th className="px-4 py-3 text-left">Vencimiento</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No hay facturas registradas.</td></tr>
            ) : filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.number}</td>
                <td className="px-4 py-3 font-medium text-foreground">{inv.third_party_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.issue_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.due_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(inv.total)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600")}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(inv); setIsModalOpen(true); }} className="p-1.5 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchInvoices} initialType={activeTab} initialData={editingItem} />
    </div>
  );
}
