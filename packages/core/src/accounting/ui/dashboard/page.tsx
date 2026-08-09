"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle, Plus, Trash2 } from "lucide-react";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLORS = ["#2563eb","#10b981","#ef4444","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#64748b"];
const fmt = (n: number) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(n);
const fmtShort = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`;

const STORAGE_KEY = "voltac_dashboard_widgets";

interface DashboardData {
  cashflow: { income: number; expenses: number; balance: number };
  invoices: { paid: number; pending: number; overdue: number; total_count: number };
  clients_count: number;
  pending_invoices: { count: number };
  overdue_invoices: { count: number; amount: number };
  top_clients: { name: string; total: number }[];
  recent_transactions: any[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthlyTx, setMonthlyTx] = useState<any[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<any[]>([]);
  const [monthlyBalance, setMonthlyBalance] = useState<any[]>([]);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [widgetDraft, setWidgetDraft] = useState({ title: "", type: "area", color: "#2563eb" });

  useEffect(() => {
    Promise.all([
      fetch("/api/accounting/dashboard").then(r=>r.json()),
      fetch("/api/accounting/transactions").then(r=>r.json()),
      fetch("/api/accounting/invoices?type=emitted").then(r=>r.json()),
    ]).then(([dash, tx, inv]) => {
      if (dash.success) setData(dash.data);
      if (tx.success) buildMonthlyData(tx.data, inv.success ? inv.data : []);
      if (!tx.success && inv.success) buildMonthlyData([], inv.data);
      setLoading(false);
    });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCustomWidgets(saved);
    } catch {}
  }, []);

  const buildMonthlyData = (transactions: any[], invoices: any[]) => {
    const income = MONTHS.map((_, idx) => {
      const monthTx = transactions.filter((t: any) => {
        const d = new Date(t.date||"");
        return d.getMonth()===idx && d.getFullYear()===new Date().getFullYear() && t.status!=="Anulado";
      });
      const inc = monthTx.filter((t:any)=>t.type==="Ingreso").reduce((a:number,t:any)=>a+t.amount,0);
      const exp = monthTx.filter((t:any)=>t.type==="Egreso").reduce((a:number,t:any)=>a+t.amount,0);
      return { month: MONTHS[idx], income: inc, expenses: exp, balance: inc - exp };
    });
    setMonthlyTx(income);
    setMonthlyBalance(income.map(m => ({ month: m.month, balance: m.balance })));

    const paid = invoices.filter((i:any)=>i.status==="Pagada").reduce((a:number,i:any)=>a+(i.total||0),0);
    const pending = invoices.filter((i:any)=>["Enviada","Parcialmente pagada"].includes(i.status)).reduce((a:number,i:any)=>a+(i.total||0),0);
    const overdue = invoices.filter((i:any)=>i.status==="Vencida").reduce((a:number,i:any)=>a+(i.total||0),0);
    setInvoiceStatus([
      { name: "Cobradas", value: paid, color: "#10b981" },
      { name: "Pendientes", value: pending, color: "#f59e0b" },
      { name: "Vencidas", value: overdue, color: "#ef4444" },
    ].filter(s => s.value > 0));
  };

  const addWidget = () => {
    const w = { id: Date.now(), ...widgetDraft, data: monthlyTx };
    const updated = [...customWidgets, w];
    setCustomWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowWidgetEditor(false);
    setWidgetDraft({ title: "", type: "area", color: "#2563eb" });
  };

  const removeWidget = (id: number) => {
    const updated = customWidgets.filter((w:any) => w.id !== id);
    setCustomWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando dashboard...</div>
  );

  const kpi = data?.cashflow;
  const inv = data?.invoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Resumen financiero de tu empresa.</p>
        </div>
        <button onClick={()=>setShowWidgetEditor(v=>!v)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16}/> Widget
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard icon={<TrendingUp size={18}/>} label="Ingresos" value={fmt(kpi?.income||0)} color="text-green-600" bg="bg-green-50 border-green-200" />
        <KpiCard icon={<TrendingDown size={18}/>} label="Egresos" value={fmt(kpi?.expenses||0)} color="text-red-500" bg="bg-red-50 border-red-200" />
        <KpiCard icon={<DollarSign size={18}/>} label="Balance" value={fmt(kpi?.balance||0)} color={(kpi?.balance||0)>=0?"text-green-600":"text-red-500"} bg={(kpi?.balance||0)>=0?"bg-green-50 border-green-200":"bg-red-50 border-red-200"} />
        <KpiCard icon={<FileText size={18}/>} label="Facturado" value={fmt((inv?.paid||0)+(inv?.pending||0)+(inv?.overdue||0))} color="text-blue-600" bg="bg-blue-50 border-blue-200" />
        <KpiCard icon={<AlertTriangle size={18}/>} label="Pendientes" value={String(data?.pending_invoices?.count||0)} color="text-amber-600" bg="bg-amber-50 border-amber-200" />
        <KpiCard icon={<AlertTriangle size={18}/>} label="Vencidas" value={fmt(data?.overdue_invoices?.amount||0)} color="text-red-500" bg="bg-red-50 border-red-200" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Income vs Expenses */}
        <ChartCard title="Ingresos vs Egresos Mensuales" subtitle={`${new Date().getFullYear()}`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTx} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="month" tick={{fontSize:11}} tickLine={false} axisLine={{stroke:"rgba(128,128,128,0.15)"}} />
              <YAxis tickFormatter={fmtShort} tick={{fontSize:11}} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => fmt(Number(v)||0)} contentStyle={{borderRadius:12,fontSize:13}} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Invoice Status Pie */}
        <ChartCard title="Estado de Facturación" subtitle="Emitidas">
          {invoiceStatus.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie data={invoiceStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                    {invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v)||0)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {invoiceStatus.map((s: any) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor:s.color}} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-semibold text-foreground">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Sin facturas registradas</div>
          )}
        </ChartCard>

        {/* Monthly Balance Trend */}
        <ChartCard title="Balance Mensual" subtitle="Ingresos - Egresos">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyBalance}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="month" tick={{fontSize:11}} tickLine={false} axisLine={{stroke:"rgba(128,128,128,0.15)"}} />
              <YAxis tickFormatter={fmtShort} tick={{fontSize:11}} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => fmt(Number(v)||0)} contentStyle={{borderRadius:12,fontSize:13}} />
              <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} fill="url(#balanceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Clients */}
        <ChartCard title="Top Clientes" subtitle="Por facturación">
          {data?.top_clients && data.top_clients.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.top_clients.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <div className="h-1.5 bg-secondary/10 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{width:`${Math.min(100,(c.total/(data.top_clients[0]?.total||1))*100)}%`}} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Sin datos de clientes</div>
          )}
        </ChartCard>
      </div>

      {/* Custom Widgets */}
      {customWidgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {customWidgets.map((w: any) => (
            <ChartCard key={w.id} title={w.title} subtitle="Widget personalizado" actions={
              <button onClick={()=>removeWidget(w.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={14}/></button>
            }>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyTx}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="month" tick={{fontSize:11}} tickLine={false} axisLine={{stroke:"rgba(128,128,128,0.15)"}} />
                  <YAxis tickFormatter={fmtShort} tick={{fontSize:11}} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: any) => fmt(Number(v)||0)} contentStyle={{borderRadius:12,fontSize:13}} />
                  <Area type="monotone" dataKey="balance" stroke={w.color} strokeWidth={2} fill={w.color+"20"} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      )}

      {/* Widget Editor Modal */}
      {showWidgetEditor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground">Nuevo Widget Personalizado</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input value={widgetDraft.title} onChange={e=>setWidgetDraft(d=>({...d,title:e.target.value}))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Ej. Balance General"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>setWidgetDraft(d=>({...d,color:c}))}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{backgroundColor:c, borderColor: widgetDraft.color===c ? "var(--foreground)" : "transparent"}} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={()=>setShowWidgetEditor(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background text-foreground">Cancelar</button>
              <button onClick={addWidget} disabled={!widgetDraft.title}
                className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`bg-background border rounded-xl p-4 shadow-sm ${bg.replace("bg-","border-").split(" ")[0]||""}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
