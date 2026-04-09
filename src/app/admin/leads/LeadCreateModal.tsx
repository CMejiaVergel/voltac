"use client";

import * as React from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createManualLead } from "./actions";

export default function LeadCreateModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = React.useState({
    fullName: "", phone: "", email: "", modality: "manual",
    projectType: "", stage: "Nuevo", priority: "Media",
    message: "", note: ""
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) return alert("Nombre y teléfono son obligatorios.");
    setIsSubmitting(true);
    await createManualLead(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-border p-8 md:p-12">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-muted rounded-full hover:bg-border transition-colors text-secondary/50">
          <X size={20}/>
        </button>

        <h2 className="text-3xl font-black text-secondary tracking-tight mb-2">Ingresar Lead Manual</h2>
        <p className="text-secondary/60 text-sm mb-8">Captura clientes de otros medios (WhatsApp, Referidos) al pipeline.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Nombre Completo *</label>
              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Celular *</label>
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Correo Electrónico</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Tipología del Lead</label>
              <select value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                 <option value="">Seleccionar...</option><option>Residencial</option><option>Comercial</option><option>Industrial</option><option>Media Tensión</option>
              </select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Etapa Inicial</label>
              <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                 <option>Nuevo</option><option>Contactado</option><option>Propuesta enviada</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-secondary/70">Prioridad</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm">
                 <option>Alta</option><option>Media</option><option>Baja</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-secondary/70">Detalles o Requerimiento</label>
            <textarea rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full border border-border p-3 rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none" placeholder="El lead busca bajar su recibo de 2 millones..."/>
          </div>

          <div className="space-y-2 p-5 bg-primary/5 border border-primary/20 rounded-xl">
            <label className="text-xs font-bold uppercase text-primary">Agregar Nota Inicial al Historial (Opcional)</label>
            <input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full border-none p-3 rounded-lg shadow-sm text-sm outline-none" placeholder="Escribe el primer tracking del historial..."/>
          </div>

          <Button type="submit" size="lg" className="w-full h-14" disabled={isSubmitting}>
             {isSubmitting ? "Registrando..." : <><Send className="mr-2" size={18}/> Iniciar Pipeline</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
