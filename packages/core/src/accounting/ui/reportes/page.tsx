"use client";

import React, { useState, useEffect } from "react";
import { Download, TrendingUp, TrendingDown, FileText, BarChart2 } from "lucide-react";
import { cn } from "../../../utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ReportesPage() {
  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    Promise.all([
      fetch("/api/accounting/dashboard").then(r => r.json()),
      fetch("/api/accounting/transactions").then(r => r.json()),
      fetch("/api/accounting/invoices?type=emitted").then(r => r.json()),
    ]).then(([dash, tx, inv]) => {
      if (dash.success) setData(dash.data);
      if (tx.success) setTransactions(tx.data.filter((t: any) => t.status !== "Anulado"));
      if (inv.success) setInvoices(inv.data.filter((i: any) => i.status !== "Anulada"));
    }).finally(() => setIsLoading(false));
  }, []);

  // Build monthly cashflow data for the selected year
  const monthlyData = MONTHS.map((month, idx) => {
    const monthTx = transactions.filter((t: any) => {
      const d = new Date(t.date || "");
      return d.getFullYear() === year && d.getMonth() === idx;
    });
    const income = monthTx.filter((t: any) => t.type === "Ingreso").reduce((a: number, t: any) => a + t.amount, 0);
    const expenses = monthTx.filter((t: any) => t.type === "Egreso").reduce((a: number, t: any) => a + t.amount, 0);
    return { name: month, Ingresos: income, Egresos: expenses, Balance: income - expenses };
  });

  // Invoice status breakdown
  const invByStatus = ["Borrador", "Enviada", "Parcialmente pagada", "Pagada", "Vencida"].map(status => ({
    name: status,
    count: invoices.filter(i => i.status === status).length,
    total: invoices.filter(i => i.status === status).reduce((a, i) => a + (i.total || 0), 0),
  }));

  const totalFact = invoices.reduce((a, i) => a + (i.total || 0), 0);
  const totalCobrado = invoices.filter(i => i.status === "Pagada").reduce((a, i) => a + (i.total || 0), 0);
  const collectionRate = totalFact > 0 ? ((totalCobrado / totalFact) * 100).toFixed(1) : "0";

  const handleExport = (entity: string) => {
    window.open(`/api/accounting/export?entity=${entity}`, "_blank");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Cargando reportes...</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Reportes Financieros</h2>
          <p className="text-muted-foreground text-sm mt-1">Análisis detallado del desempeño financiero de Voltac Systems.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none">
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Quick Export Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Exportar Transacciones", entity: "transactions" },
          { label: "Exportar Facturas", entity: "invoices" },
          { label: "Exportar Clientes", entity: "clients" },
          { label: "Exportar Proveedores", entity: "suppliers" },
        ].map(({ label, entity }) => (
          <button key={entity} onClick={() => handleExport(entity)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Facturado", value: fmt(totalFact), color: "text-foreground", icon: <FileText size={16} className="text-primary" /> },
          { label: "Total Cobrado", value: fmt(totalCobrado), color: "text-green-600", icon: <TrendingUp size={16} className="text-green-500" /> },
          { label: "Tasa de Cobro", value: `${collectionRate}%`, color: collectionRate >= "70" ? "text-green-600" : "text-amber-600", icon: <BarChart2 size={16} className="text-blue-500" /> },
          { label: "Facturas Vencidas", value: String(invByStatus.find(s => s.name === "Vencida")?.count || 0), color: "text-red-500", icon: <TrendingDown size={16} className="text-red-500" /> },
        ].map(kpi => (
          <div key={kpi.label} className="bg-background border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">{kpi.icon}{kpi.label}</div>
            <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Cashflow Bar Chart */}
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground text-sm mb-4">Ingresos vs Egresos por Mes — {year}</h3>
        {monthlyData.every(d => d.Ingresos === 0 && d.Egresos === 0) ? (
          <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
            Sin movimientos registrados para {year}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Balance Line Chart */}
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground text-sm mb-4">Balance Acumulado — {year}</h3>
        {monthlyData.every(d => d.Balance === 0) ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sin datos.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="Balance" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 3 }} name="Balance Neto" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Invoice Status Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Estado de Cartera — Facturas Emitidas</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/5 text-muted-foreground text-xs font-medium border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Monto Total</th>
              <th className="px-4 py-3 text-right">% del Total</th>
            </tr>
          </thead>
          <tbody>
            {invByStatus.map(row => (
              <tr key={row.name} className="border-b border-border hover:bg-secondary/5 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{row.count}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(row.total)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {totalFact > 0 ? `${((row.total / totalFact) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
            <tr className="bg-secondary/5 font-bold">
              <td className="px-4 py-3 text-foreground">Total</td>
              <td className="px-4 py-3 text-right text-foreground">{invoices.length}</td>
              <td className="px-4 py-3 text-right text-primary">{fmt(totalFact)}</td>
              <td className="px-4 py-3 text-right text-foreground">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
