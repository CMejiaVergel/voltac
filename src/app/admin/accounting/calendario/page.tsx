"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Calendar, FileText, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const EVENT_STYLES: Record<string, string> = {
  invoice_due: "bg-red-100 text-red-700 border-red-200",
  general:     "bg-blue-100 text-blue-700 border-blue-200",
  meeting:     "bg-purple-100 text-purple-700 border-purple-200",
  payment:     "bg-green-100 text-green-700 border-green-200",
  reminder:    "bg-amber-100 text-amber-700 border-amber-200",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  invoice_due: <AlertCircle size={11} />,
  general:     <Calendar size={11} />,
  meeting:     <Calendar size={11} />,
  payment:     <FileText size={11} />,
  reminder:    <AlertCircle size={11} />,
};

interface CalendarEvent {
  id: string | number;
  title: string;
  type: string;
  date: string;
  description?: string;
  virtual?: boolean;
}

interface NewEventForm {
  title: string;
  type: string;
  date: string;
  time: string;
  description: string;
}

export default function CalendarioPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [form, setForm] = useState<NewEventForm>({ title: "", type: "general", date: "", time: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/accounting/calendar?month=${monthKey}`);
    const j = await res.json();
    if (j.success) setEvents(j.data);
  }, [monthKey]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const getDateStr = (day: number) => `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const eventsForDay = (day: number) => events.filter(e => e.date === getDateStr(day));
  const selectedEvents = selectedDay ? events.filter(e => e.date === selectedDay) : [];

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setIsSaving(true);
    try {
      await fetch("/api/accounting/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowNewEvent(false);
      setForm({ title: "", type: "general", date: "", time: "", description: "" });
      fetchEvents();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string | number) => {
    if (String(id).startsWith("inv-")) return; // virtual — can't delete
    if (!confirm("¿Eliminar este evento?")) return;
    await fetch(`/api/accounting/calendar/${id}`, { method: "DELETE" });
    fetchEvents();
    setSelectedDay(null);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Calendario Contable</h2>
          <p className="text-muted-foreground text-sm mt-1">Eventos, vencimientos de facturas y recordatorios.</p>
        </div>
        <button
          onClick={() => { setShowNewEvent(true); setForm(f => ({ ...f, date: todayStr })); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-background border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Month Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={prevMonth} className="p-1.5 hover:bg-secondary/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></button>
            <h3 className="font-bold text-foreground text-base">{MONTHS_ES[currentMonth]} {currentYear}</h3>
            <button onClick={nextMonth} className="p-1.5 hover:bg-secondary/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"><ChevronRight size={18} /></button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} className="h-24 border-b border-r border-border bg-secondary/3" />;
              const dateStr = getDateStr(day);
              const dayEvents = eventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                  className={cn(
                    "h-24 border-b border-r border-border p-1.5 cursor-pointer transition-colors overflow-hidden",
                    isSelected ? "bg-primary/5" : "hover:bg-secondary/5"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                    isToday ? "bg-primary text-white" : "text-foreground"
                  )}>{day}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, i) => (
                      <div key={i} className={cn("text-[10px] font-medium px-1 py-0.5 rounded border flex items-center gap-0.5 truncate", EVENT_STYLES[ev.type] || EVENT_STYLES.general)}>
                        {EVENT_ICONS[ev.type] || EVENT_ICONS.general}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 2} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground mb-3">Leyenda</h4>
            <div className="space-y-2">
              {[
                { type: "invoice_due", label: "Vencimiento Factura" },
                { type: "payment", label: "Pago" },
                { type: "general", label: "Evento General" },
                { type: "meeting", label: "Reunión" },
                { type: "reminder", label: "Recordatorio" },
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full border", EVENT_STYLES[type]?.split(" ").filter(c => c.startsWith("bg-"))[0])} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Events */}
          {selectedDay && (
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {selectedDay} — {selectedEvents.length} evento(s)
              </h4>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin eventos este día.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} className={cn("p-3 rounded-lg border text-xs", EVENT_STYLES[ev.type] || EVENT_STYLES.general)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold flex items-center gap-1">{EVENT_ICONS[ev.type]}{ev.title}</div>
                        {!ev.virtual && (
                          <button onClick={() => handleDelete(ev.id)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {ev.description && <p className="mt-1 opacity-80">{ev.description}</p>}
                      {ev.virtual && <span className="mt-1 inline-block opacity-60 italic">Auto — vencimiento de factura</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          {!selectedDay && (
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground mb-3">Próximos en este mes</h4>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin eventos este mes.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {events.slice(0, 10).map(ev => (
                    <div key={ev.id} className={cn("px-3 py-2 rounded-lg border text-xs flex items-start gap-2", EVENT_STYLES[ev.type] || EVENT_STYLES.general)}>
                      <div className="mt-0.5 shrink-0">{EVENT_ICONS[ev.type]}</div>
                      <div>
                        <p className="font-semibold">{ev.title}</p>
                        <p className="opacity-70">{ev.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Event Modal */}
      {showNewEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-foreground">Nuevo Evento</h3>
              <button onClick={() => setShowNewEvent(false)} className="p-1.5 hover:bg-secondary/10 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej. Reunión con cliente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                    <option value="general">General</option>
                    <option value="meeting">Reunión</option>
                    <option value="payment">Pago</option>
                    <option value="reminder">Recordatorio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
              <button onClick={() => setShowNewEvent(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background transition-colors text-foreground">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving || !form.title || !form.date}
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
