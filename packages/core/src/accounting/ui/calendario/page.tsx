"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, AlertTriangle, Calendar, CreditCard, Users, Bell, FileText, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../../utils";

const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PRIORITIES = ["Alta","Media","Baja"] as const;
const EVENT_TYPES = ["general","Tributario","Pago","Reunión","Recordatorio"] as const;
type Priority = typeof PRIORITIES[number];
type EventType = typeof EVENT_TYPES[number];

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; urgent?: boolean }> = {
  Tributario:  { label:"Tributario",  color:"text-red-700",   bg:"bg-red-50",    border:"border-red-500",  icon:<AlertTriangle size={13}/>, urgent:true },
  Pago:        { label:"Pago",        color:"text-green-700", bg:"bg-green-50",  border:"border-green-500",icon:<CreditCard size={13}/> },
  Reunión:     { label:"Reunión",     color:"text-purple-700",bg:"bg-purple-50", border:"border-purple-400",icon:<Users size={13}/> },
  Recordatorio:{ label:"Recordatorio",color:"text-amber-700", bg:"bg-amber-50",  border:"border-amber-400", icon:<Bell size={13}/> },
  general:     { label:"General",     color:"text-blue-700",  bg:"bg-blue-50",   border:"border-blue-400",  icon:<Calendar size={13}/> },
};
const PRIORITY_CFG: Record<Priority,{label:string;cls:string}> = {
  Alta:  { label:"ALTA",  cls:"bg-red-100 text-red-700 border-red-200" },
  Media: { label:"MEDIA", cls:"bg-amber-100 text-amber-700 border-amber-200" },
  Baja:  { label:"BAJA",  cls:"bg-gray-100 text-gray-600 border-gray-200" },
};

// ── helpers ──
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const getMondayOf = (d: Date) => { const r=new Date(d); r.setDate(d.getDate()-((d.getDay()+6)%7)); return r; };
const addDays = (d: Date, n: number) => { const r=new Date(d); r.setDate(d.getDate()+n); return r; };

interface CalEvent { id:string|number; title:string; type:string; date:string; time?:string; description?:string; priority?:string; virtual?:boolean; linked_type?:string; linked_id?:any; }

export default function CalendarioPage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(getMondayOf(today));
  const [selectedDay, setSelectedDay] = useState<string|null>(toDateStr(today));
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:"", type:"general" as EventType, date:toDateStr(today), time:"", description:"", priority:"Media" as Priority });
  const [isSaving, setIsSaving] = useState(false);

  const weekDays = Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}`;

  const fetchEvents = useCallback(async()=>{
    const res = await fetch(`/api/accounting/calendar`);
    const j = await res.json();
    if(j.success) setEvents(j.data);
  },[]);

  useEffect(()=>{ fetchEvents(); },[fetchEvents]);

  // Compute counts per day per type
  const countsByDay = (dateStr:string, type:string) =>
    events.filter(e=>e.date===dateStr && (type==="all"||e.type===type)).length;

  // Displayed events: filter by selectedDay or whole week, then by type
  const visibleEvents = events.filter(e=>{
    const inWeek = weekDays.some(d=>toDateStr(d)===e.date);
    const inDay  = !selectedDay || e.date===selectedDay;
    const inType = filter==="all" || e.type===filter;
    return inWeek && inDay && inType;
  }).sort((a,b)=>{
    if(a.date!==b.date) return a.date.localeCompare(b.date);
    return (a.time||"00:00").localeCompare(b.time||"00:00");
  });

  // Group by day
  const grouped: Record<string, CalEvent[]> = {};
  for(const ev of visibleEvents){
    if(!grouped[ev.date]) grouped[ev.date]=[];
    grouped[ev.date].push(ev);
  }

  const handleSave = async()=>{
    if(!form.title||!form.date) return;
    setIsSaving(true);
    await fetch("/api/accounting/calendar",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setShowModal(false);
    setForm({title:"",type:"general",date:toDateStr(today),time:"",description:"",priority:"Media"});
    fetchEvents();
    setIsSaving(false);
  };
  const handleDelete = async(id:string|number)=>{
    if(String(id).startsWith("inv-")) return;
    if(!confirm("¿Eliminar evento?")) return;
    await fetch(`/api/accounting/calendar/${id}`,{method:"DELETE"});
    setExpandedId(null);
    fetchEvents();
  };

  const typeFilters = ["all",...EVENT_TYPES];

  return (
    <div className="space-y-0">
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={()=>{ setWeekStart(getMondayOf(today)); setSelectedDay(toDateStr(today)); }}
            className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-secondary/5 text-foreground transition-colors">
            Hoy
          </button>
          <button onClick={()=>setWeekStart(d=>addDays(d,-7))} className="p-1.5 hover:bg-secondary/10 rounded-lg text-muted-foreground"><ChevronLeft size={16}/></button>
          <button onClick={()=>setWeekStart(d=>addDays(d,7))}  className="p-1.5 hover:bg-secondary/10 rounded-lg text-muted-foreground"><ChevronRight size={16}/></button>
          <span className="text-sm font-semibold text-foreground">
            {DAYS_ES[weekStart.getDay()]} {weekStart.getDate()} — {DAYS_ES[addDays(weekStart,6).getDay()]} {addDays(weekStart,6).getDate()} {MONTHS_ES[weekStart.getMonth()]} {weekStart.getFullYear()}
          </span>
        </div>
        <button onClick={()=>{ setShowModal(true); setForm(f=>({...f,date:selectedDay||toDateStr(today)})); }}
          className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={15}/> Nuevo Evento
        </button>
      </div>

      {/* ─── Week grid header ─── */}
      <div className="bg-background border border-border rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map(d=>{
            const ds = toDateStr(d);
            const isToday = ds===toDateStr(today);
            const isSel = ds===selectedDay;
            const total = countsByDay(ds,"all");
            return (
              <button key={ds} onClick={()=>setSelectedDay(isSel?null:ds)}
                className={cn("p-3 text-left border-r border-border last:border-0 transition-colors hover:bg-secondary/5",
                  isSel?"bg-primary/5 border-b-2 border-b-primary":"")}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{DAYS_ES[(d.getDay()+0)%7]}</span>
                  <span className={cn("text-sm font-bold", isToday?"w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs":"text-foreground")}>
                    {isToday ? d.getDate() : d.getDate()}
                  </span>
                </div>
                {Object.entries(TYPE_CFG).map(([type, cfg])=>{
                  const n = countsByDay(ds, type);
                  if(!n) return null;
                  return (
                    <div key={type} className="flex items-center gap-1 mb-0.5">
                      <span className={cn("text-[10px] font-semibold", cfg.color, cfg.urgent?"font-bold":"")}>{cfg.label}</span>
                      <span className={cn("text-[10px] font-bold", cfg.urgent?"text-red-700":"text-muted-foreground")}>{n}</span>
                    </div>
                  );
                })}
                {total===0 && <span className="text-[10px] text-muted-foreground/50">Sin eventos</span>}
              </button>
            );
          })}
        </div>

        {/* ─── Filter tabs ─── */}
        <div className="flex gap-0 border-b border-border overflow-x-auto">
          {typeFilters.map(t=>(
            <button key={t} onClick={()=>setFilter(t)}
              className={cn("px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                filter===t
                  ? t==="Tributario" ? "border-red-500 text-red-700 bg-red-50/50" : "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t==="all" ? "Todos" : TYPE_CFG[t]?.label || t}
            </button>
          ))}
        </div>

        {/* ─── Event list ─── */}
        <div className="max-h-[520px] overflow-y-auto">
          {Object.keys(grouped).length===0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {selectedDay ? "Sin eventos este día." : "Sin eventos esta semana."}
            </div>
          ) : Object.entries(grouped).map(([dateStr, dayEvents])=>{
            const d = new Date(dateStr+"T00:00:00");
            return (
              <div key={dateStr}>
                {/* Day header */}
                <div className="sticky top-0 bg-secondary/5 border-b border-border px-4 py-2 z-10">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    {DAYS_ES[d.getDay()]}, {d.getDate()} de {MONTHS_ES[d.getMonth()]} {d.getFullYear()}
                  </span>
                </div>

                {dayEvents.map(ev=>{
                  const cfg = TYPE_CFG[ev.type] || TYPE_CFG.general;
                  const isExpanded = expandedId===String(ev.id);
                  const priority = (ev.priority || "Media") as Priority;
                  const isUrgent = ev.type==="Tributario";
                  return (
                    <div key={ev.id}
                      className={cn("border-b border-border last:border-0",
                        isUrgent ? "border-l-4 border-l-red-500 bg-red-50/30" : `border-l-4 ${cfg.border}`)}>
                      {/* Row */}
                      <button className="w-full text-left px-4 py-3 hover:bg-secondary/5 transition-colors"
                        onClick={()=>setExpandedId(isExpanded?null:String(ev.id))}>
                        <div className="flex items-center gap-3">
                          {/* Time */}
                          <span className="text-xs text-muted-foreground font-mono w-10 shrink-0">
                            {ev.time||"—"}
                          </span>
                          {/* Type icon */}
                          <span className={cn("shrink-0", cfg.color)}>{cfg.icon}</span>
                          {/* Title */}
                          <span className={cn("flex-1 text-sm font-medium", isUrgent?"text-red-800":"text-foreground")}>
                            {isUrgent && <AlertTriangle size={11} className="inline mr-1 text-red-600"/>}
                            {ev.title}
                          </span>
                          {/* Type badge */}
                          <span className={cn("hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.bg, cfg.color, cfg.urgent?"border-red-300":"border-transparent")}>
                            {cfg.label}
                          </span>
                          {/* Priority badge */}
                          {priority==="Alta" && (
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", PRIORITY_CFG[priority].cls)}>
                              {PRIORITY_CFG[priority].label}
                            </span>
                          )}
                          {/* Virtual badge */}
                          {ev.virtual && <span className="text-[10px] text-muted-foreground italic">auto</span>}
                          {/* Expand icon */}
                          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground"/> : <ChevronDown size={14} className="text-muted-foreground"/>}
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className={cn("px-4 pb-4 pt-1 space-y-3 border-t", cfg.bg.replace("bg-","bg-").replace("/50",""))}>
                          {/* Priority full row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", PRIORITY_CFG[priority].cls)}>
                              Prioridad: {PRIORITY_CFG[priority].label}
                            </span>
                            {isUrgent && (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={11}/> Evento Tributario — Acción requerida ante la DIAN
                              </span>
                            )}
                          </div>
                          {/* Description */}
                          {ev.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
                          )}
                          {/* Linked doc */}
                          {ev.linked_type==="invoice" && (
                            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              <FileText size={12}/> Vinculado a factura ID #{ev.linked_id}
                            </div>
                          )}
                          {/* Actions */}
                          {!ev.virtual && (
                            <div className="flex gap-2 pt-1">
                              <button onClick={()=>handleDelete(ev.id)}
                                className="flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 transition-colors">
                                <Trash2 size={12}/> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── New Event Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-foreground">Nuevo Evento</h3>
              <button onClick={()=>setShowModal(false)} className="p-1.5 hover:bg-secondary/10 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej. Declaración Renta" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as EventType}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                    {EVENT_TYPES.map(t=><option key={t} value={t}>{TYPE_CFG[t]?.label||t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridad</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                    {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {form.type==="Tributario" && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={13}/> Este evento se marcará como <strong>ALTA PRIORIDAD</strong> automáticamente
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora</label>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"/>
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background transition-colors text-foreground">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving||!form.title||!form.date}
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                {isSaving?"Guardando...":"Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
