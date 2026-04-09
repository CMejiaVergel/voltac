"use client";

import React from "react";
import { Plus, Edit2, Trash2, Globe, EyeOff, MapPin, Briefcase } from "lucide-react";
import Image from "next/image";
import { createProject, updateProject, deleteProject, toggleProjectStatus } from "./actions";

export default function ProyectosClient({ initialData }: { initialData: any[] }) {
  const [proyectos, setProyectos] = React.useState(initialData);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    title: "", techType: "Software Custom", challenge: "", solution: "", 
    metrics: "[]", imageUrl: "/Voltac_enviroment.png", gallery: "[]", isPublished: false
  });

  const handleOpen = (proj: any = null) => {
    if (proj) {
      setEditingData(proj);
      setFormData({
        title: proj.title, techType: proj.techType, challenge: proj.challenge, 
        solution: proj.solution, metrics: proj.metrics, imageUrl: proj.imageUrl,
        gallery: proj.gallery, isPublished: proj.isPublished === 1
      });
    } else {
      setEditingData(null);
      setFormData({
        title: "", techType: "Software Custom", challenge: "", solution: "", 
        metrics: '[{"label":"Reducción Costos", "value":"40%"}]', imageUrl: "/Voltac_enviroment.png", gallery: "[]", isPublished: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (editingData) {
      await updateProject(editingData.id, formData);
    } else {
      await createProject(formData);
    }
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este proyecto tecnológico?")) {
      await deleteProject(id);
      window.location.reload();
    }
  };

  const handleToggleStatus = async (id: number, current: boolean) => {
    await toggleProjectStatus(id, current);
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-secondary">Portafolio Tech</h1>
          <p className="text-secondary/60 text-sm mt-1">Sube y publica los casos de éxito de desarrollo e IA.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all uppercase text-sm tracking-wider" onClick={() => handleOpen()}>
          <Plus size={18}/> Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos.map((p) => (
          <div key={p.id} className={`bg-white rounded-2xl overflow-hidden border transition-all ${p.isPublished ? 'border-border shadow-md' : 'border-dashed border-secondary/30 opacity-75'}`}>
            <div className="h-48 relative bg-muted group">
              <Image src={p.imageUrl || '/Voltac_enviroment.png'} alt={p.title} fill className="object-cover transition-transform group-hover:scale-105" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button title="Editar" className="p-2 bg-white/90 text-secondary rounded-full shadow hover:bg-white" onClick={() => handleOpen(p)}><Edit2 size={16}/></button>
                <button title="Eliminar" className="p-2 bg-red-500/90 text-white rounded-full shadow hover:bg-red-500" onClick={() => handleDelete(p.id)}><Trash2 size={16}/></button>
              </div>
              <div className="absolute bottom-4 left-4">
                {p.isPublished ? (
                  <span className="flex items-center gap-1.5 bg-green-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"><Globe size={12}/> Público</span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-secondary/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"><EyeOff size={12}/> Oculto</span>
                )}
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
                  <Briefcase size={12}/> {p.techType}
                </div>
                <h3 className="font-extrabold text-secondary text-lg leading-tight line-clamp-2">{p.title}</h3>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex gap-4 text-xs font-semibold text-secondary/60">
              <button 
                onClick={() => handleToggleStatus(p.id, p.isPublished === 1)}
                className="hover:text-primary transition-colors uppercase"
              >
                {p.isPublished ? "Ocultar" : "Publicar"}
              </button>
            </div>
          </div>
        ))}
        {proyectos.length === 0 && (
          <div className="col-span-full py-16 text-center text-secondary/50 font-medium">
            No has cargado ningún proyecto al portafolio tecnológico.
          </div>
        )}
      </div>

      {/* Basic Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-border p-6">
            <h2 className="text-xl font-bold mb-6 text-secondary">{editingData ? 'Editar Proyecto' : 'Registrar Nuevo Proyecto'}</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-secondary/60">Título del Proyecto</label>
                  <input type="text" required className="w-full form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-secondary/60">Tipo de Tecnología</label>
                  <select required className="w-full form-input" value={formData.techType} onChange={e => setFormData({...formData, techType: e.target.value})}>
                    <option>Software Custom</option><option>Inteligencia Artificial</option><option>App Móvil</option><option>IoT & Hardware</option><option>Automatización WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-secondary/60">El Reto (Problema del cliente)</label>
                <textarea required rows={3} className="w-full form-input resize-none" value={formData.challenge} onChange={e => setFormData({...formData, challenge: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-secondary/60">La Solución Implementada</label>
                <textarea required rows={3} className="w-full form-input resize-none" value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-secondary/60">Métricas (JSON Array)</label>
                <textarea rows={2} className="w-full form-input font-mono text-xs" value={typeof formData.metrics === 'string' ? formData.metrics : JSON.stringify(formData.metrics)} onChange={e => setFormData({...formData, metrics: e.target.value})} />
                <p className="text-[10px] text-secondary/50">Ej: <code>{`[{"label": "Reducción Tiempo", "value": "90%"}, {"label": "Usuarios", "value": "1M+"}]`}</code></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-secondary/60">URL Imagen Portada</label>
                <input type="text" className="w-full form-input" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isPub" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />
                <label htmlFor="isPub" className="text-sm font-bold text-secondary cursor-pointer">Publicar directamente en la web</label>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-bold text-secondary/60 hover:bg-muted rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-md">Guardar Proyecto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
