"use client";

import * as React from "react";
import { X, Send, Save, FileText, Tag, Clock, User, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateLead, addNote } from "./actions";

export default function LeadDetailModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState(lead);
  const [newNote, setNewNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);

  // Sync edits
  const handleSave = async () => {
    setIsEditing(false);
    await updateLead(lead.id, formData);
  };

  const submitNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    await addNote(lead.id, newNote);
    setNewNote("");
    setSavingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-[2rem] max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl relative border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-black text-secondary tracking-tight">Lead #{lead.id} — {lead.fullName}</h2>
            <div className="flex gap-3 text-xs font-semibold text-secondary/50 mt-1 uppercase tracking-wider">
              <span>{lead.source}</span> • <span>{new Date(lead.createdAt).toLocaleString('es-CO')}</span> • <span>{lead.modality}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-border text-secondary/60 transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row bg-muted/20">
          
          {/* Left Column: Info & Edit */}
          <div className="w-full md:w-3/5 p-6 space-y-8 bg-white md:overflow-y-auto border-r border-border">
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white" onClick={() => updateLead(lead.id, { stage: 'Contactado' })}>Contactado</Button>
              <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => updateLead(lead.id, { stage: 'Propuesta enviada' })}>Prop. Enviada</Button>
              <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white" onClick={() => { if(confirm("¿Cerrar como Ganado?")) updateLead(lead.id, { stage: 'Ganado' }); }}>Ganado</Button>
              <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white" onClick={() => { if(confirm("¿Cerrar como Perdido?")) updateLead(lead.id, { stage: 'Perdido' }); }}>Perdido</Button>
            </div>

            {/* Editable Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold text-secondary text-lg uppercase tracking-wider">Información CRM</h3>
                 <Button variant="ghost" size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                   {isEditing ? <><Save className="mr-2" size={16}/> Guardar</> : "Editar Datos"}
                 </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Etapa Pipeline</label>
                   {isEditing ? (
                     <select className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                        <option>Nuevo</option><option>Contactado</option><option>En análisis</option><option>Propuesta enviada</option><option>Negociación</option><option>Ganado</option><option>Perdido</option>
                     </select>
                   ) : <div className="text-sm font-semibold">{lead.stage}</div>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Estado Seguimiento</label>
                   {isEditing ? (
                     <select className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option>Pendiente de contacto</option><option>Esperando respuesta</option><option>Requiere seguimiento</option><option>Cerrado</option>
                     </select>
                   ) : <div className="text-sm font-semibold">{lead.status}</div>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Prioridad</label>
                   {isEditing ? (
                     <select className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                        <option>Alta</option><option>Media</option><option>Baja</option>
                     </select>
                   ) : <div className={`text-sm font-bold ${lead.priority === 'Alta' ? 'text-red-500' : ''}`}>{lead.priority}</div>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Próximo Segumiento</label>
                   {isEditing ? (
                     <input type="date" className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.followUpDate ? formData.followUpDate.split('T')[0] : ''} onChange={e => setFormData({...formData, followUpDate: e.target.value})} />
                   ) : <div className="text-sm font-semibold flex gap-2 items-center"><Calendar size={14}/> {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'No asignado'}</div>}
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Asignado a</label>
                   {isEditing ? (
                     <input type="text" placeholder="Asesor..." className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.assignedTo || ''} onChange={e => setFormData({...formData, assignedTo: e.target.value})} />
                   ) : <div className="text-sm font-semibold flex gap-2 items-center"><User size={14}/> {lead.assignedTo || 'Sin asignar'}</div>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-secondary/60 uppercase">Tipo</label>
                   {isEditing ? (
                     <select className="w-full form-input p-2 rounded-lg border bg-muted/50 outline-none text-sm" value={formData.projectType || ''} onChange={e => setFormData({...formData, projectType: e.target.value})}>
                        <option value="">Desconocido</option><option>Residencial</option><option>Comercial</option><option>Industrial</option><option>Media Tensión</option>
                     </select>
                   ) : <div className="text-sm font-semibold flex gap-2 items-center"><Tag size={14}/> {lead.projectType || 'Sin clasificar'}</div>}
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
               <h3 className="font-bold text-secondary text-lg uppercase tracking-wider mb-4">Datos Originales (Sólo Lectura)</h3>
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Celular / WhatsApp</label><span className="font-semibold text-primary">{lead.phone}</span></div>
                  <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Email</label><span className="font-semibold">{lead.email || '—'}</span></div>
                  {lead.consumption && <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Consumo</label><span className="font-semibold">{lead.consumption} kWh</span></div>}
                  {lead.address && <div className="col-span-2"><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Dirección / Ciudad</label><span className="font-semibold">{lead.address}</span></div>}
                  {lead.location && <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Ubicación</label><span className="font-semibold">{lead.location}</span></div>}
                  {lead.installType && <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Inmueble</label><span className="font-semibold">{lead.installType}</span></div>}
                  {lead.gridType && <div><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Red Eléctrica</label><span className="font-semibold">{lead.gridType}</span></div>}
                  {lead.objective && <div className="col-span-2"><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Objetivo del Proyecto</label><span className="font-semibold">{lead.objective}</span></div>}
                  {lead.message && <div className="col-span-2"><label className="text-xs font-bold text-secondary/50 uppercase block mb-1">Mensaje/Detalles Proporcionados</label><span className="font-semibold text-secondary/70 italic p-3 bg-muted rounded-xl block mt-1">{lead.message}</span></div>}
                  
                  {lead.filePath && (
                     <div className="col-span-2 mt-4">
                        <a href={lead.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-4 border border-primary/30 rounded-2xl bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-colors">
                           <FileText size={20}/> Abrir Documento Adjunto de la Solicitud
                        </a>
                     </div>
                  )}
               </div>
            </div>

          </div>

          {/* Right Column: Notes & History */}
          <div className="w-full md:w-2/5 flex flex-col bg-white">
            <div className="p-6 border-b border-border shadow-sm z-10">
               <h3 className="font-bold text-secondary flex items-center gap-2 text-lg uppercase tracking-wider"><Clock size={18}/> Historial & Notas</h3>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
               {(lead.notes || []).length === 0 ? (
                 <p className="text-secondary/40 text-sm text-center italic mt-10">No hay historial activo.</p>
               ) : (
                 (lead.notes || []).map((n: any) => (
                   <div key={n.id} className={`flex flex-col gap-1 p-4 rounded-2xl border ${n.isSystem ? 'bg-muted/50 border-transparent' : 'bg-primary/5 border-primary/20'}`}>
                     <div className="flex justify-between items-start text-xs font-semibold text-secondary/50 uppercase">
                       <span>{n.author} {n.isSystem ? '(Sistema)' : ''}</span>
                       <span className="font-light">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}</span>
                     </div>
                     <p className={`text-sm mt-1 whitespace-pre-line ${n.isSystem ? 'text-secondary/60 italic' : 'text-secondary font-medium'}`}>{n.content}</p>
                   </div>
                 ))
               )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex gap-2 items-end">
               <div className="flex-1">
                 <textarea 
                   rows={2} 
                   value={newNote}
                   onChange={e => setNewNote(e.target.value)}
                   placeholder="Agregar una nota al hilo del lead..."
                   className="w-full resize-none rounded-xl border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                 />
               </div>
               <Button onClick={submitNote} disabled={savingNote || !newNote.trim()} className="shrink-0 h-[68px] w-[68px] rounded-xl">
                 <Send size={20} className={savingNote ? 'animate-pulse' : ''}/>
               </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
