"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, FileText, CreditCard, X, Loader2 } from "lucide-react";
import { InvoiceModal } from "./components/InvoiceModal";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Borrador":            "bg-gray-100 text-gray-600 border-gray-200",
  "Enviada":             "bg-blue-100 text-blue-700 border-blue-200",
  "Parcialmente pagada": "bg-amber-100 text-amber-700 border-amber-200",
  "Pagada":              "bg-green-100 text-green-700 border-green-200",
  "Vencida":             "bg-red-100 text-red-700 border-red-200",
  "Anulada":             "bg-red-50 text-red-400 border-red-100",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

interface Payment { id: number; date: string; amount: number; method: string; reference: string; }
interface PayPanelState { isOpen: boolean; invoice: any | null; payments: Payment[]; isLoading: boolean; }

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState<"emitted" | "received">("emitted");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Payment panel state
  const [payPanel, setPayPanel] = useState<PayPanelState>({ isOpen: false, invoice: null, payments: [], isLoading: false });
  const [payForm, setPayForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], method: "Transferencia", reference: "", notes: "" });
  const [isSavingPay, setIsSavingPay] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounting/invoices?type=${activeTab}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data.filter((i: any) => i.status !== "Anulada"));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas anular esta factura?")) return;
    await fetch(`/api/accounting/invoices/${id}`, { method: "DELETE" });
    fetchInvoices();
  };

  const openPayPanel = async (invoice: any) => {
    setPayPanel({ isOpen: true, invoice, payments: [], isLoading: true });
    setPayForm({ amount: "", date: new Date().toISOString().split("T")[0], method: "Transferencia", reference: "", notes: "" });
    const res = await fetch(`/api/accounting/invoices/${invoice.id}/pay`);
    const j = await res.json();
    setPayPanel(prev => ({ ...prev, payments: j.success ? j.data : [], isLoading: false }));
  };

  const handleRegisterPayment = async () => {
    if (!payPanel.invoice || !payForm.amount || !payForm.date) return;
    setIsSavingPay(true);
    try {
      const res = await fetch(`/api/accounting/invoices/${payPanel.invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }),
      });
      const j = await res.json();
      if (j.success) {
        // Refresh payments and invoice list
        const pRes = await fetch(`/api/accounting/invoices/${payPanel.invoice.id}/pay`);
        const pJ = await pRes.json();
        setPayPanel(prev => ({ ...prev, payments: pJ.success ? pJ.data : [] }));
        setPayForm({ amount: "", date: new Date().toISOString().split("T")[0], method: "Transferencia", reference: "", notes: "" });
        fetchInvoices();
      }
    } finally { setIsSavingPay(false); }
  };

  const filtered = invoices.filter(i =>
    i.number?.toLowerCase().includes(search.toLowerCase()) ||
    i.third_party_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((a: number, i: any) => a + (i.total || 0), 0);
  const totalPaid = filtered.filter((i: any) => i.status === "Pagada").reduce((a: number, i: any) => a + (i.total || 0), 0);
  const totalPending = filtered.filter((i: any) => ["Enviada", "Parcialmente pagada", "Vencida"].includes(i.status)).reduce((a: number, i: any) => a + (i.total || 0), 0);

  // Calc paid amount for a given invoice
  const calcPaid = (inv: any) => {
    const payments = payPanel.invoice?.id === inv.id ? payPanel.payments : [];
    return payments.reduce((a: number, p: Payment) => a + p.amount, 0);
  };

  const handleExport = () => window.open(`/api/accounting/export?entity=invoices&type=${activeTab}`, "_blank");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Facturación</h2>
          <p className="text-muted-foreground text-sm mt-1">Gestión de facturas emitidas y recibidas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={16} /><span className="hidden sm:inline">Exportar Excel</span>
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
        ].map(kpi => (
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
        <input type="text" placeholder="Buscar por número o nombre..." value={search} onChange={e => setSearch(e.target.value)}
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
            ) : filtered.map(inv => (
              <tr key={inv.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.number}</td>
                <td className="px-4 py-3 font-medium text-foreground">{inv.third_party_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.issue_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.due_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(inv.total)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600")}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {inv.status !== "Pagada" && activeTab === "emitted" && (
                      <button onClick={() => openPayPanel(inv)} title="Registrar pago" className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors">
                        <CreditCard size={15} />
                      </button>
                    )}
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

      {/* Payment Side Panel */}
      {payPanel.isOpen && payPanel.invoice && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setPayPanel(p => ({ ...p, isOpen: false }))} />
          <div className="w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-foreground">Pagos — {payPanel.invoice.number}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Total: {fmt(payPanel.invoice.total)}</p>
              </div>
              <button onClick={() => setPayPanel(p => ({ ...p, isOpen: false }))} className="p-2 hover:bg-secondary/10 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payment History */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Historial de Pagos</h4>
                {payPanel.isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : payPanel.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin pagos registrados aún.</p>
                ) : (
                  <div className="space-y-2">
                    {payPanel.payments.map(p => (
                      <div key={p.id} className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-green-700">
                          <span>{fmt(p.amount)}</span>
                          <span>{p.date?.slice(0, 10)}</span>
                        </div>
                        <div className="text-green-600 mt-0.5">{p.method}{p.reference ? ` — Ref: ${p.reference}` : ""}</div>
                      </div>
                    ))}
                    <div className="text-xs text-right font-bold text-green-700 pt-1 border-t border-border">
                      Total pagado: {fmt(payPanel.payments.reduce((a, p) => a + p.amount, 0))}
                    </div>
                  </div>
                )}
              </div>

              {/* Register New Payment */}
              <div className="border-t border-border pt-5">
                <h4 className="text-sm font-semibold text-foreground mb-4">Registrar Pago</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Monto *</label>
                      <input type="number" step="0.01" min="0.01" value={payForm.amount}
                        onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Fecha *</label>
                      <input type="date" value={payForm.date}
                        onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Método de Pago</label>
                    <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                      <option>Tarjeta de Crédito</option>
                      <option>Tarjeta de Débito</option>
                      <option>Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Referencia / Comprobante</label>
                    <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                      placeholder="Ej. TXN-123456"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <button onClick={handleRegisterPayment} disabled={isSavingPay || !payForm.amount || !payForm.date}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
                    {isSavingPay ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Registrar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
