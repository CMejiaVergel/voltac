"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { TransactionModal } from "./components/TransactionModal";
import { cn } from "../../../utils";

const STATUS_COLORS: Record<string, string> = {
  "Completado": "bg-green-100 text-green-700",
  "Pendiente": "bg-amber-100 text-amber-700",
  "Anulado": "bg-red-100 text-red-500",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

export default function IngresosEgresosPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"" | "Ingreso" | "Egreso">("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"Ingreso" | "Egreso">("Ingreso");

  const handleExport = () => {
    const url = filterType
      ? `/api/accounting/export?entity=transactions&type=${filterType}`
      : `/api/accounting/export?entity=transactions`;
    window.open(url, "_blank");
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const url = filterType
        ? `/api/accounting/transactions?type=${filterType}`
        : "/api/accounting/transactions";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setTransactions(json.data.filter((t: any) => t.status !== "Anulado"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [filterType]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas anular este movimiento?")) return;
    await fetch(`/api/accounting/transactions/${id}`, { method: "DELETE" });
    fetchTransactions();
  };

  const openModal = (type: "Ingreso" | "Egreso", item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const filtered = transactions.filter((t) =>
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalIngresos = filtered.filter((t) => t.type === "Ingreso").reduce((a, t) => a + t.amount, 0);
  const totalEgresos = filtered.filter((t) => t.type === "Egreso").reduce((a, t) => a + t.amount, 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Ingresos & Egresos</h2>
          <p className="text-muted-foreground text-sm mt-1">Registro centralizado de todos los movimientos financieros.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={16} /><span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button onClick={() => openModal("Egreso")} className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
            <TrendingDown size={16} /><span className="hidden sm:inline">Egreso</span>
          </button>
          <button onClick={() => openModal("Ingreso")} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
            <TrendingUp size={16} /><span className="hidden sm:inline">Ingreso</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1"><TrendingUp size={12} className="text-green-500" />Total Ingresos</p>
          <p className="text-xl font-bold mt-1 text-green-600">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1"><TrendingDown size={12} className="text-red-500" />Total Egresos</p>
          <p className="text-xl font-bold mt-1 text-red-500">{fmt(totalEgresos)}</p>
        </div>
        <div className={cn("bg-background border rounded-xl p-4 shadow-sm", balance >= 0 ? "border-green-200" : "border-red-200")}>
          <p className="text-xs text-muted-foreground font-medium">Balance del Período</p>
          <p className={cn("text-xl font-bold mt-1", balance >= 0 ? "text-green-600" : "text-red-500")}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input type="text" placeholder="Buscar por concepto..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-2">
          {(["", "Ingreso", "Egreso"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                filterType === t ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:bg-secondary/5")}>
              {t === "" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Concepto</th>
              <th className="px-4 py-3 text-left">Método</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No hay movimientos registrados.</td></tr>
            ) : filtered.map((tx) => (
              <tr key={tx.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                <td className="px-4 py-3">
                  <div className={cn("flex items-center gap-1.5 font-medium w-fit px-2 py-1 rounded-full text-xs",
                    tx.type === "Ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                    {tx.type === "Ingreso" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{tx.type}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{tx.date?.slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{tx.description}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.payment_method || "—"}</td>
                <td className={cn("px-4 py-3 text-right font-bold", tx.type === "Ingreso" ? "text-green-600" : "text-red-500")}>
                  {tx.type === "Egreso" ? "-" : "+"}{fmt(tx.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[tx.status] || "")}>{tx.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(tx.type, tx)} className="p-1.5 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(tx.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTransactions} initialType={modalType} initialData={editingItem} />
    </div>
  );
}
