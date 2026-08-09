"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, FileText, Users, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "../../utils";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`;
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function AccountingDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounting/dashboard").then(r => r.json()).then(j => { if (j.success) setData(j.data); }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Cargando datos financieros...</div>;

  const { cashflow, invoices, clients_count, pending_invoices, overdue_invoices, top_clients, recent_transactions } = data || {};

  const monthMap: Record<string, { income: number; expenses: number }> = {};
  (recent_transactions || []).forEach((tx: any) => {
    const d = new Date(tx.date || Date.now());
    const key = MONTHS[d.getMonth()];
    if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
    if (tx.type === "Ingreso") monthMap[key].income += tx.amount;
    else monthMap[key].expenses += tx.amount;
  });
  const chartData = Object.entries(monthMap).map(([name, v]) => ({ name, ...v }));

  const pieData = [
    { name: "Pagadas", value: invoices?.paid || 0 },
    { name: "Por cobrar", value: invoices?.pending || 0 },
    { name: "Vencidas", value: invoices?.overdue || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary">Dashboard Financiero</h2>
        <p className="text-muted-foreground text-sm mt-1">Resumen ejecutivo del estado financiero de Voltac Systems.</p>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><TrendingUp size={13} className="text-green-500" />Ingresos Totales</div>
          <p className="text-2xl font-bold text-green-600">{fmt(cashflow?.income)}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><TrendingDown size={13} className="text-red-500" />Egresos Totales</div>
          <p className="text-2xl font-bold text-red-500">{fmt(cashflow?.expenses)}</p>
        </div>
        <div className={cn("bg-background border rounded-xl p-5 shadow-sm", (cashflow?.balance||0)>=0 ? "border-green-200" : "border-red-200")}>
          <div className="text-xs text-muted-foreground mb-2">Balance Neto</div>
          <p className={cn("text-2xl font-bold", (cashflow?.balance||0)>=0 ? "text-green-600" : "text-red-500")}>{fmt(cashflow?.balance)}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><Users size={13} className="text-primary" />Clientes Activos</div>
          <p className="text-2xl font-bold text-primary">{clients_count || 0}</p>
        </div>
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Facturas Cobradas", val: fmt(invoices?.paid), sub: "", color: "text-blue-600", bg: "bg-blue-100", Icon: FileText, border: "border-border" },
          { label: "Cuentas por Cobrar", val: fmt(invoices?.pending), sub: `${pending_invoices||0} pendiente(s)`, color: "text-amber-600", bg: "bg-amber-100", Icon: FileText, border: "border-amber-200" },
          { label: "Facturas Vencidas", val: fmt(overdue_invoices?.amount), sub: `${overdue_invoices?.count||0} factura(s)`, color: "text-red-500", bg: "bg-red-100", Icon: AlertCircle, border: "border-red-200" },
        ].map(k => (
          <div key={k.label} className={cn("bg-background border rounded-xl p-5 shadow-sm flex items-center gap-4", k.border)}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", k.bg)}><k.Icon size={22} className={k.color} /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
              <p className={cn("text-xl font-bold", k.color)}>{k.val}</p>
              {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-background border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-4">Flujo de Caja — Ingresos vs Egresos</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sin movimientos registrados para graficar.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" dot={false} />
                <Area type="monotone" dataKey="expenses" name="Egresos" stroke="#ef4444" strokeWidth={2} fill="url(#gExpenses)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-4">Estado de Facturas</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sin facturas.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Top 5 Clientes</h3>
            <Link href="/admin/accounting/clientes-proveedores" className="text-primary text-xs flex items-center gap-1 hover:underline">Ver todos <ArrowRight size={12} /></Link>
          </div>
          {(!top_clients || top_clients.length === 0) ? <p className="text-muted-foreground text-sm text-center py-4">Sin datos aún.</p> : (
            <div className="space-y-3">
              {top_clients.map((c: any, i: number) => {
                const pct = top_clients[0].total > 0 ? (c.total / top_clients[0].total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i+1}</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{fmt(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Movimientos Recientes</h3>
            <Link href="/admin/accounting/ingresos-egresos" className="text-primary text-xs flex items-center gap-1 hover:underline">Ver todos <ArrowRight size={12} /></Link>
          </div>
          {(!recent_transactions || recent_transactions.length === 0) ? <p className="text-muted-foreground text-sm text-center py-4">Sin movimientos aún.</p> : (
            <div className="space-y-2">
              {recent_transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", tx.type==="Ingreso" ? "bg-green-100" : "bg-red-100")}>
                      {tx.type==="Ingreso" ? <TrendingUp size={13} className="text-green-600" /> : <TrendingDown size={13} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date?.slice(0,10)}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold", tx.type==="Ingreso" ? "text-green-600" : "text-red-500")}>
                    {tx.type==="Egreso" ? "-" : "+"}{fmt(tx.amount)}
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
