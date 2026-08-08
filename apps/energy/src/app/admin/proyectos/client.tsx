"use client";

import * as React from "react";
import { FolderKanban, Plus, Image as ImageIcon, Trash2, Eye, EyeOff, TreeDeciduous, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePublishProject, deleteProject, createProject, bulkPublishProjects, bulkDeleteProjects, updateProject } from "./actions";

export default function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = React.useState(initialProjects);
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<any>(null);
  const [delTarget, setDelTarget] = React.useState<number | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  
  React.useEffect(() => { setProjects(initialProjects); }, [initialProjects]);

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if(next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Gestión de Proyectos</h1>
          <p className="text-secondary/60">Sube tu obra, y el motor de IA calculará la huella de carbono y el impacto financiero automáticamente.</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {selectedIds.size > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 mr-4 bg-muted/50 p-1.5 rounded-xl border border-border">
               <span className="text-xs font-bold text-secondary/60 self-center px-2">{selectedIds.size} seleccionados:</span>
               <button onClick={async () => {
                  const pass = prompt("Clave admin para eliminar " + selectedIds.size + " proyectos:");
                  if(pass) {
                    const res = await bulkDeleteProjects(Array.from(selectedIds), pass);
                    if(res.success) setSelectedIds(new Set()); else alert(res.error);
                  }
               }} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Trash2 size={14}/> Purgar</button>
               <button onClick={async () => {
                  const res = await bulkPublishProjects(Array.from(selectedIds), true);
                  if(res.success) setSelectedIds(new Set()); else alert(res.error);
               }} className="text-xs bg-primary/20 hover:bg-primary/30 text-secondary px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Eye size={14}/> Publicar</button>
            </div>
          )}
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus size={18}/> Agregar Nuevo Proyecto
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {projects.length === 0 && (
           <div className="col-span-full py-20 text-center flex flex-col items-center justify-center font-bold text-secondary/30">
               <FolderKanban size={64} className="mb-4 opacity-50"/>
               <p className="text-xl">Sin proyectos. Construye el primero interactuando arriba.</p>
           </div>
         )}
         {projects.map(p => (
           <div key={p.id} onClick={() => toggleSelection(p.id)} className={`bg-white rounded-[2rem] border overflow-hidden shadow-lg flex flex-col group relative cursor-pointer transition-all ${selectedIds.has(p.id) ? 'ring-4 ring-primary border-primary' : 'border-border'}`}>
              <div className="absolute top-4 left-4 z-20">
                 <input type="checkbox" checked={selectedIds.has(p.id)} readOnly className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shadow-xl" />
              </div>
              {/* Cover Image */}
              <div className="h-48 relative overflow-hidden bg-muted flex items-center justify-center">
                 {p.imageUrl ? (
                   <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                 ) : (
                   <ImageIcon className="text-secondary/20" size={48} />
                 )}
                 <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={async (e) => {
                         e.stopPropagation();
                         const maxedOut = p.isPublished === 0 && projects.filter(x => x.isPublished).length >= 6;
                         if(maxedOut) { alert("Has superado el tope de 6 proyectos públicos fijado. Oculta otro primero."); return; }
                         await togglePublishProject(p.id, p.isPublished === 1);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-colors shadow-2xl ${
                        p.isPublished ? 'bg-primary text-secondary hover:bg-primary/80' : 'bg-secondary/60 text-white hover:bg-secondary/80'
                      }`}
                    >
                       {p.isPublished ? <><Eye size={14}/> Público</> : <><EyeOff size={14}/> Oculto</>}
                    </button>
                 </div>
              </div>

              {/* Data Content */}
              <div className="p-6 flex-1 flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl leading-tight text-secondary max-w-[80%]">{p.name}</h3>
                    {delTarget === p.id ? (
                      <div className="flex flex-col gap-1 items-end bg-red-50 p-2 rounded-xl -mt-2 -mr-2 absolute top-48 right-4 shadow-xl z-10 w-48 border border-red-200 animate-in fade-in">
                        <input type="password" id={`pass_${p.id}`} className="w-full text-xs p-1.5 border border-red-200 rounded text-center mb-1" placeholder="Clave admin..." />
                        <div className="flex gap-1 w-full">
                           <button className="flex-1 text-xs bg-red-600 text-white rounded font-bold py-1" onClick={async () => {
                             const pass = (document.getElementById(`pass_${p.id}`) as HTMLInputElement)?.value;
                             const res = await deleteProject(p.id, pass);
                             if(!res.success) alert(res.error); else setDelTarget(null);
                           }}>Purgar</button>
                           <button className="flex-1 text-xs bg-muted text-secondary rounded font-bold py-1" onClick={() => setDelTarget(null)}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(p); }} className="text-secondary/50 hover:text-primary transition-colors p-1.5 bg-muted rounded-full">Editar</button>
                        <button onClick={(e) => { e.stopPropagation(); setDelTarget(p.id); }} className="text-secondary/30 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                      </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2 text-xs font-bold text-secondary/60 uppercase tracking-widest mb-4">
                    <span>{p.city}, {p.department}</span>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-muted p-2.5 rounded-xl border border-border">
                       <span className="text-[10px] text-secondary/50 font-bold uppercase block mb-0.5">Potencia</span>
                       <span className="font-black text-secondary">{p.power} <span className="text-primary">{p.powerUnit}</span></span>
                    </div>
                    <div className="bg-muted p-2.5 rounded-xl border border-border">
                       <span className="text-[10px] text-secondary/50 font-bold uppercase block mb-0.5">Topología</span>
                       <span className="font-bold text-secondary text-xs truncate" title={p.projectType}>{p.projectType}</span>
                    </div>
                    <div className="bg-muted p-2.5 rounded-xl border border-border">
                       <span className="text-[10px] text-secondary/50 font-bold uppercase block mb-0.5">Estado</span>
                       <span className="font-bold text-secondary text-xs truncate">{p.status}</span>
                    </div>
                    <div className="bg-muted p-2.5 rounded-xl border border-border">
                       <span className="text-[10px] text-secondary/50 font-bold uppercase block mb-0.5">Conexión</span>
                       <span className="font-bold text-secondary text-xs truncate">{p.connectionType}</span>
                    </div>
                 </div>

                 {/* Algorithm Computations */}
                 <div className="mt-auto pt-4 border-t border-border space-y-2">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-secondary/40 text-center mb-3">Modelos de Impacto Algorítmicos IA</h4>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><TreeDeciduous size={16}/></div>
                       <div>
                          <p className="text-secondary font-black">{parseFloat(p.co2calc).toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider">Toneladas CO₂ Evitadas (anual)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                       <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0"><Banknote size={16}/></div>
                       <div>
                          <p className="text-secondary font-black">${parseFloat(p.savingsCalc).toLocaleString('es-CO')}</p>
                          <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-wider">Ahorro COP Proyectado (anual)</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {(isCreating || editingProject) && <ProjectCreateModal editProject={editingProject} onClose={() => { setIsCreating(false); setEditingProject(null); }} />}
    </div>
  );
}

function ProjectCreateModal({ onClose, editProject }: { onClose: () => void, editProject?: any }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formAction = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const file = formData.get("file") as File | null;
      if (file && file.size > 50 * 1024 * 1024) {
         alert("La imagen fotografica es demasiado pesada (" + (file.size / 1024 / 1024).toFixed(1) + "MB). Debe pesar debajo de 50MB.");
         setIsSubmitting(false);
         return;
      }

      if (!editProject && (!file || file.size === 0)) {
         alert("Por favor selecciona un archivo fotográfico.");
         setIsSubmitting(false);
         return;
      }

      const res = editProject 
        ? await updateProject(editProject.id, formData) 
        : await createProject(formData);
        
      if (!res.success) alert(res.error);
      else onClose();
    } catch (err: any) {
      alert("Error al procesar: " + (err.message || "Verifica tu conexión."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-border p-8 text-secondary">
        <h2 className="text-3xl font-black tracking-tight mb-2">{editProject ? "Editar Proyecto" : "Ingresar Obra Ejecutada"}</h2>
        <p className="text-secondary/60 text-sm mb-6">{editProject ? "Modifica los valores deseados. Deja la foto vacía para conservarla." : "Las fotos se comprimen automáticamente a calidad web (1920px, JPEG 80%)."}</p>

        {isSubmitting ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-secondary tracking-tight mb-2">Comprimiendo & Calculando...</h3>
              <p className="text-secondary/60 text-sm max-w-sm mx-auto">
                La Inteligencia Artificial está optimizando la imagen de alta resolución para la web y computando el modelo de impacto ambiental.
                <br /><br />
                <span className="font-bold text-primary">Por favor, no cierres ni recargues esta ventana.</span>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await formAction(fd);
          }} className="space-y-5" encType="multipart/form-data">
           <div className="grid md:grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-xs font-bold uppercase tracking-wider">Nombre del Proyecto</label>
                 <input required name="name" defaultValue={editProject?.name} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="EJ: Planta Solar EcoMall..." />
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                   <label className="text-xs font-bold uppercase tracking-wider">Capacidad / Potencia</label>
                   <input required type="number" step="any" name="power" defaultValue={editProject?.power} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="250" />
                </div>
                <div className="w-1/3">
                   <label className="text-xs font-bold uppercase tracking-wider">Unidad</label>
                   <select name="powerUnit" defaultValue={editProject?.powerUnit} className="w-full p-3 bg-muted rounded-xl outline-none"><option>kWp</option><option>kW</option><option>W</option><option>MW</option></select>
                </div>
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Valor KWh Promedio (Para COP$)</label>
                 <input required type="number" step="any" name="kwValue" defaultValue={editProject?.kwValue} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="EJ: 950" />
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Tipo (Topología de Obra)</label>
                 <select required name="projectType" defaultValue={editProject?.projectType} className="w-full p-3 bg-muted rounded-xl outline-none"><option>Residencial</option><option>Comercial</option><option>Industrial</option><option>Mini granja</option><option>Granja Solar PPA</option></select>
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Conexión de Red</label>
                 <select required name="connectionType" defaultValue={editProject?.connectionType} className="w-full p-3 bg-muted rounded-xl outline-none"><option>Conectado a la red</option><option>Aislados</option><option>Híbridos</option><option>Generación a Escala</option></select>
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Ciudad / Municipio</label>
                 <input required name="city" defaultValue={editProject?.city} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="Bucaramanga..." />
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">% Ahorro en Factura (Ej: 90)</label>
                 <input type="number" step="any" required name="reductionPercent" defaultValue={editProject?.reductionPercent} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="90" />
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Retorno Inversión (Ej: 4-5 años)</label>
                 <input required name="roiRange" defaultValue={editProject?.roiRange} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="3.5 - 4.5 años" />
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Departamento</label>
                 <input required name="department" defaultValue={editProject?.department} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="Santander..." />
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Estado Técnico</label>
                 <select required name="status" defaultValue={editProject?.status} className="w-full p-3 bg-muted rounded-xl outline-none"><option>Ejecutado</option><option>En Ejecución</option></select>
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-wider">Fecha / Año (Vigencia)</label>
                 <input required name="dateExecuted" defaultValue={editProject?.dateExecuted} className="w-full p-3 bg-muted rounded-xl outline-none" placeholder="Septiembre 2025" />
              </div>

              <div className="col-span-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-primary">Fotografía Deslumbrante (Portada)</label>
                 <input name="file" type="file" required={!editProject} accept="image/*" className="w-full p-3 bg-primary/5 rounded-xl border border-primary/20 outline-none text-sm text-secondary/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-secondary hover:file:bg-primary/80" />
              </div>
           </div>

           <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button type="submit" variant="default" className="flex-1 bg-secondary text-primary">{editProject ? "Guardar Cambios" : "Ingresar Proyecto"}</Button>
           </div>
        </form>
        )}
      </div>
    </div>
  );
}
