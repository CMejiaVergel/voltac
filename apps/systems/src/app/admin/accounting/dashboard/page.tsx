"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, X, Settings, Trash2, GripVertical, ChevronDown } from "lucide-react";
import { LWChart } from "@/components/LWChart";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type ChartType  = "area" | "line" | "histogram";
type DataSource = "income" | "expenses" | "balance" | "invoice_total" | "invoice_paid" | "invoice_pending";
type Operator   = "+" | "-" | "*" | "/";

interface Formula { a: DataSource; op: Operator; b: DataSource; }
interface Widget {
  id: string; title: string; type: ChartType;
  source: DataSource; color: string;
  formula?: Formula | null;
  height: number;
  year: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "area",      label: "Área" },
  { value: "line",      label: "Línea" },
  { value: "histogram", label: "Barras" },
];
const SOURCES: { value: DataSource; label: string }[] = [
  { value: "income",          label: "Ingresos Mensuales" },
  { value: "expenses",        label: "Egresos Mensuales" },
  { value: "balance",         label: "Balance Mensual" },
  { value: "invoice_total",   label: "Facturas Emitidas (Total)" },
  { value: "invoice_paid",    label: "Facturas Cobradas" },
  { value: "invoice_pending", label: "Facturas Pendientes" },
];
const COLORS = ["#2563eb","#10b981","#ef4444","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#64748b"];
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmtVal = (n: number) =>
  n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`;

const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Helpers ────────────────────────────────────────────────────────────────
const defaultWidget = (): Widget => ({
  id: mkId(), title: "Nuevo Widget", type: "area",
  source: "income", color: "#2563eb", formula: null, height: 220,
  year: new Date().getFullYear(),
});

const STORAGE_KEY = "voltac_dashboard_widgets";
const loadWidgets   = (): Widget[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } };
const saveWidgets   = (w: Widget[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(w));

// ── Main component ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices,     setInvoices]     = useState<any[]>([]);
  const [editingId,    setEditingId]    = useState<string|null>(null);
  const [draft,        setDraft]        = useState<Widget>(defaultWidget());

  // Load persisted widgets on mount (client-only)
  useEffect(() => { setWidgets(loadWidgets()); }, []);

  // Fetch raw data
  useEffect(() => {
    fetch("/api/accounting/transactions").then(r=>r.json()).then(j=>{ if(j.success) setTransactions(j.data); });
    fetch("/api/accounting/invoices?type=emitted").then(r=>r.json()).then(j=>{ if(j.success) setInvoices(j.data); });
  }, []);

  // ── Data builder ──────────────────────────────────────────────────────────
  const getMonthlyData = useCallback((source: DataSource, year: number) => {
    return MONTHS.map((m, idx) => {
      const dateStr = `${year}-${String(idx+1).padStart(2,"0")}-01`;
      let value = 0;

      if (source === "income" || source === "expenses" || source === "balance") {
        const monthTx = transactions.filter(t => {
          const d = new Date(t.date||"");
          return d.getFullYear()===year && d.getMonth()===idx && t.status!=="Anulado";
        });
        if (source === "income")    value = monthTx.filter(t=>t.type==="Ingreso").reduce((a,t)=>a+t.amount,0);
        if (source === "expenses")  value = monthTx.filter(t=>t.type==="Egreso").reduce((a,t)=>a+t.amount,0);
        if (source === "balance") {
          const inc = monthTx.filter(t=>t.type==="Ingreso").reduce((a,t)=>a+t.amount,0);
          const exp = monthTx.filter(t=>t.type==="Egreso").reduce((a,t)=>a+t.amount,0);
          value = inc - exp;
        }
      } else {
        const monthInv = invoices.filter(i => {
          const d = new Date(i.issue_date||"");
          return d.getFullYear()===year && d.getMonth()===idx && i.status!=="Anulada";
        });
        if (source === "invoice_total")   value = monthInv.reduce((a,i)=>a+(i.total||0),0);
        if (source === "invoice_paid")    value = monthInv.filter(i=>i.status==="Pagada").reduce((a,i)=>a+(i.total||0),0);
        if (source === "invoice_pending") value = monthInv.filter(i=>["Enviada","Parcialmente pagada","Vencida"].includes(i.status)).reduce((a,i)=>a+(i.total||0),0);
      }
      return { time: dateStr, value };
    });
  }, [transactions, invoices]);

  const getWidgetData = useCallback((w: Widget) => {
    if (!w.formula) return getMonthlyData(w.source, w.year);
    const a = getMonthlyData(w.formula.a, w.year);
    const b = getMonthlyData(w.formula.b, w.year);
    return a.map((pt, i) => {
      let v = pt.value;
      const bv = b[i]?.value ?? 0;
      if      (w.formula!.op==="+") v = pt.value + bv;
      else if (w.formula!.op==="-") v = pt.value - bv;
      else if (w.formula!.op==="*") v = pt.value * bv;
      else if (w.formula!.op==="/") v = bv !== 0 ? pt.value / bv : 0;
      return { ...pt, value: v };
    });
  }, [getMonthlyData]);

  // ── Widget CRUD ───────────────────────────────────────────────────────────
  const addWidget = () => {
    const w = defaultWidget();
    setDraft(w);
    setEditingId("new");
  };

  const saveWidget = () => {
    const updated = editingId === "new"
      ? [...widgets, draft]
      : widgets.map(w => w.id === editingId ? draft : w);
    setWidgets(updated);
    saveWidgets(updated);
    setEditingId(null);
  };

  const deleteWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    setWidgets(updated);
    saveWidgets(updated);
    if (editingId === id) setEditingId(null);
  };

  const openEdit = (w: Widget) => { setDraft({ ...w }); setEditingId(w.id); };

  const srcLabel = (s: DataSource) => SOURCES.find(x=>x.value===s)?.label || s;

  const useFormula = !!draft.formula;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Dashboard Dinámico</h2>
          <p className="text-muted-foreground text-sm mt-1">Crea y personaliza gráficas con tus datos financieros.</p>
        </div>
        <button onClick={addWidget} className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16}/> Agregar Widget
        </button>
      </div>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Plus size={22} className="text-primary"/></div>
          <p className="font-semibold text-foreground">Sin widgets aún</p>
          <p className="text-sm text-muted-foreground">Agrega tu primer widget para empezar a visualizar datos</p>
          <button onClick={addWidget} className="mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Agregar Widget</button>
        </div>
      )}

      {/* Widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {widgets.map(w => {
          const chartData = getWidgetData(w);
          const total = chartData.reduce((a, d) => a + d.value, 0);
          return (
            <div key={w.id} className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div>
                  <p className="font-semibold text-sm text-foreground">{w.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.formula ? `${srcLabel(w.formula.a)} ${w.formula.op} ${srcLabel(w.formula.b)}` : srcLabel(w.source)}
                    {" · "}{w.year}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-primary mr-2">{fmtVal(total)}</span>
                  <button onClick={() => openEdit(w)} className="p-1.5 hover:bg-secondary/10 rounded-lg text-muted-foreground transition-colors"><Settings size={14}/></button>
                  <button onClick={() => deleteWidget(w.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="px-4 pt-3 pb-2">
                <LWChart data={chartData} type={w.type} color={w.color} height={w.height} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/New Widget Panel */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="font-bold text-foreground">{editingId==="new"?"Nuevo Widget":"Editar Widget"}</h3>
              <button onClick={()=>setEditingId(null)} className="p-1.5 hover:bg-secondary/10 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Gráfica</label>
                  <select value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value as ChartType}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                    {CHART_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Año</label>
                  <select value={draft.year} onChange={e=>setDraft(d=>({...d,year:Number(e.target.value)}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                    {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Data source vs formula toggle */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3 cursor-pointer">
                  <input type="checkbox" checked={useFormula} className="w-4 h-4 accent-primary"
                    onChange={e=>setDraft(d=>({...d, formula: e.target.checked ? { a:"income", op:"-", b:"expenses" } : null}))} />
                  Usar fórmula (combinar dos métricas)
                </label>

                {!useFormula ? (
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Fuente de datos</label>
                    <select value={draft.source} onChange={e=>setDraft(d=>({...d,source:e.target.value as DataSource}))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                      {SOURCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="bg-secondary/5 rounded-xl p-4 space-y-3 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurar Fórmula</p>
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        <label className="block text-xs mb-1 text-muted-foreground">Métrica A</label>
                        <select value={draft.formula!.a} onChange={e=>setDraft(d=>({...d,formula:{...d.formula!,a:e.target.value as DataSource}}))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none text-foreground">
                          {SOURCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="text-center">
                        <label className="block text-xs mb-1 text-muted-foreground">Op.</label>
                        <select value={draft.formula!.op} onChange={e=>setDraft(d=>({...d,formula:{...d.formula!,op:e.target.value as Operator}}))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none text-foreground text-center">
                          {(["+","-","*","/"] as Operator[]).map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs mb-1 text-muted-foreground">Métrica B</label>
                        <select value={draft.formula!.b} onChange={e=>setDraft(d=>({...d,formula:{...d.formula!,b:e.target.value as DataSource}}))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none text-foreground">
                          {SOURCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Resultado: <strong className="text-foreground">{srcLabel(draft.formula!.a)} {draft.formula!.op} {srcLabel(draft.formula!.b)}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setDraft(d=>({...d,color:c}))}
                      className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", draft.color===c ? "border-foreground scale-110" : "border-transparent")}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium mb-1">Altura del gráfico: {draft.height}px</label>
                <input type="range" min={150} max={400} step={10} value={draft.height}
                  onChange={e=>setDraft(d=>({...d,height:Number(e.target.value)}))}
                  className="w-full accent-primary" />
              </div>

              {/* Preview */}
              {(transactions.length>0||invoices.length>0) && (
                <div className="border border-border rounded-xl p-3 bg-background">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <LWChart data={getWidgetData(draft)} type={draft.type} color={draft.color} height={draft.height} />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3 bg-secondary/5 rounded-b-2xl sticky bottom-0">
              <button onClick={()=>setEditingId(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background transition-colors text-foreground">Cancelar</button>
              <button onClick={saveWidget} disabled={!draft.title}
                className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                {editingId==="new" ? "Agregar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
