"use client";

import React from "react";
import { Plus, Edit2, Trash2, Globe, EyeOff, MapPin, Briefcase } from "lucide-react";
import Image from "next/image";
import { createProject, updateProject, deleteProject, toggleProjectStatus } from "./actions";

export default function ProyectosClient({ initialData }: { initialData: any[] }) {
  const [proyectos, setProyectos] = React.useState(initialData);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("techType", formData.techType);
      fd.append("challenge", formData.challenge);
      fd.append("solution", formData.solution);
      fd.append("metrics", typeof formData.metrics === "string" ? formData.metrics : JSON.stringify(formData.metrics));
      fd.append("isPublished", formData.isPublished ? "true" : "false");
      fd.append("existingImageUrl", formData.imageUrl);

      const fileInput = document.getElementById("coverImage") as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        fd.append("file", fileInput.files[0]);
      }

      if (editingData) {
        await updateProject(editingData.id, fd);
      } else {
        await createProject(fd);
      }
      window.location.reload();
    } catch (error) {
      alert("Error al guardar el proyecto. Revisa tu conexión y el peso de la imagen.");
      setIsSubmitting(false);
    }
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur animate-in fade-in">
          <div className="bg-background rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative border border-border">
            <div className="p-6 border-b border-border bg-white flex justify-between items-center shrink-0">
               <h2 className="text-2xl font-black">{editingData ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
               <button type="button" onClick={() => setModalOpen(false)} className="p-2 bg-muted rounded-full hover:bg-secondary/10">X</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
               <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <label className="text-xs font-bold uppercase text-secondary/60 tracking-widest">Título del Proyecto</label>
                       <input type="text" required className="w-full p-3 rounded-xl bg-white border border-border outline-none focus:border-primary text-secondary font-bold text-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Implementación CRM Custom..." />
                     </div>
                     <div>
                       <label className="text-xs font-bold uppercase text-secondary/60 tracking-widest">Tipo de Tecnología</label>
                       <select required className="w-full p-3 rounded-xl bg-white border border-border outline-none text-secondary" value={formData.techType} onChange={e => setFormData({...formData, techType: e.target.value})}>
                         <option>Software Custom</option><option>Inteligencia Artificial</option><option>App Móvil</option><option>IoT & Hardware</option><option>Automatización WhatsApp</option>
                       </select>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Imagen de Portada</label>
                     <div className="bg-muted border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 h-[180px] relative overflow-hidden">
                        {formData.imageUrl && formData.imageUrl !== '/Voltac_enviroment.png' && <Image src={formData.imageUrl} fill alt="Cover" className="object-cover absolute inset-0 opacity-30"/>}
                        <input type="file" id="coverImage" accept="image/*" className="relative z-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-secondary hover:file:bg-primary/80 cursor-pointer w-full text-secondary/60 text-sm"/>
                        <p className="text-[10px] text-secondary/50 relative z-10">Recomendado: 1920x1080px. Máximo 50MB.</p>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div className="space-y-1">
                     <label className="text-xs font-bold uppercase text-secondary/60 tracking-widest">El Reto (Problema del cliente)</label>
                     <textarea required rows={4} className="w-full p-3 rounded-xl bg-white border border-border outline-none focus:border-primary text-secondary resize-none" value={formData.challenge} onChange={e => setFormData({...formData, challenge: e.target.value})} />
                   </div>

                   <div className="space-y-1">
                     <label className="text-xs font-bold uppercase text-secondary/60 tracking-widest">La Solución Implementada</label>
                     <textarea required rows={4} className="w-full p-3 rounded-xl bg-white border border-border outline-none focus:border-primary text-secondary resize-none" value={formData.solution} onChange={e => setFormData({...formData, solution: e.target.value})} />
                   </div>

                   <div className="space-y-1">
                     <label className="text-xs font-bold uppercase text-secondary/60 tracking-widest">Métricas (JSON Array)</label>
                     <textarea rows={2} className="w-full p-3 rounded-xl bg-muted border border-border outline-none font-mono text-xs text-secondary/80 focus:ring-1 ring-primary" value={typeof formData.metrics === 'string' ? formData.metrics : JSON.stringify(formData.metrics)} onChange={e => setFormData({...formData, metrics: e.target.value})} />
                     <p className="text-[10px] text-secondary/50">Ej: <code>{`[{"label": "Reducción Tiempo", "value": "90%"}, {"label": "Usuarios", "value": "1M+"}]`}</code></p>
                   </div>
                 </div>
               </div>

               <div className="p-6 border-t border-border bg-muted/30 flex justify-between items-center shrink-0 mt-auto">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" id="isPub" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-4 h-4 accent-primary" />
                   <label htmlFor="isPub" className="text-sm font-bold text-secondary cursor-pointer">Publicar directamente en el portafolio</label>
                 </div>
                 <div className="flex gap-4">
                   <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 font-bold text-secondary/60 hover:bg-muted rounded-full" disabled={isSubmitting}>Cancelar</button>
                   <button type="submit" className="px-6 py-2 bg-secondary text-primary font-bold rounded-full hover:bg-secondary/90 shadow-md" disabled={isSubmitting}>Guardar Proyecto</button>
                 </div>
               </div>
            </form>
            {isSubmitting && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center font-bold text-xl z-50">Guardando y Comprimiendo...</div>}
          </div>
        </div>
      )}
    </div>
  );
}
