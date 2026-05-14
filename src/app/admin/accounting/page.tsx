"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, FileText, Users, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);

export default function AccountingDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("Mes Actual");

  useEffect(() => {
    fetch("/api/accounting/dashboard")
      .then((r) => r.json())
      .then((j) => { if (j.success) setData(j.data); })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Cargando datos financieros...
    </div>
  );

  const { cashflow, invoices, clients_count, pending_invoices, overdue_invoices, top_clients, recent_transactions } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Dashboard Financiero</h2>
          <p className="text-muted-foreground text-sm mt-1">Resumen ejecutivo del estado financiero de Voltac Systems.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none">
            <option>Mes Actual</option>
            <option>Trimestre</option>
            <option>Semestre</option>
            <option>Año Actual</option>
          </select>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
            <TrendingUp size={14} className="text-green-500" /> Ingresos Totales
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(cashflow?.income)}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
            <TrendingDown size={14} className="text-red-500" /> Egresos Totales
          </div>
          <p className="text-2xl font-bold text-red-500">{fmt(cashflow?.expenses)}</p>
        </div>
        <div className={cn("bg-background border rounded-xl p-5 shadow-sm", (cashflow?.balance || 0) >= 0 ? "border-green-200" : "border-red-200")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
            Balance Neto
          </div>
          <p className={cn("text-2xl font-bold", (cashflow?.balance || 0) >= 0 ? "text-green-600" : "text-red-500")}>
            {fmt(cashflow?.balance)}
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
            <Users size={14} className="text-primary" /> Clientes Activos
          </div>
          <p className="text-2xl font-bold text-primary">{clients_count || 0}</p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Facturas Cobradas</p>
            <p className="text-xl font-bold text-foreground">{fmt(invoices?.paid)}</p>
          </div>
        </div>
        <div className="bg-background border border-amber-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Cuentas por Cobrar</p>
            <p className="text-xl font-bold text-amber-600">{fmt(invoices?.pending)}</p>
            <p className="text-xs text-muted-foreground">{pending_invoices || 0} factura(s) pendiente(s)</p>
          </div>
        </div>
        <div className="bg-background border border-red-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Facturas Vencidas</p>
            <p className="text-xl font-bold text-red-500">{fmt(overdue_invoices?.amount)}</p>
            <p className="text-xs text-muted-foreground">{overdue_invoices?.count || 0} factura(s)</p>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Clients + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Top 5 Clientes por Facturación</h3>
            <Link href="/admin/accounting/clientes-proveedores" className="text-primary text-xs flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {(!top_clients || top_clients.length === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-4">Sin datos aún.</p>
          ) : (
            <div className="space-y-3">
              {top_clients.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{c.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Movimientos Recientes</h3>
            <Link href="/admin/accounting/ingresos-egresos" className="text-primary text-xs flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {(!recent_transactions || recent_transactions.length === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-4">Sin movimientos aún.</p>
          ) : (
            <div className="space-y-2">
              {recent_transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      tx.type === "Ingreso" ? "bg-green-100" : "bg-red-100")}>
                      {tx.type === "Ingreso"
                        ? <TrendingUp size={13} className="text-green-600" />
                        : <TrendingDown size={13} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold", tx.type === "Ingreso" ? "text-green-600" : "text-red-500")}>
                    {tx.type === "Egreso" ? "-" : "+"}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
