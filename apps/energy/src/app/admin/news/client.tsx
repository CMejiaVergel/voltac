"use client";

import * as React from "react";
import { Plus, Trash2, Eye, EyeOff, Edit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNewsEntry, updateNewsEntry, deleteNewsEntry, toggleNewsStatus, bulkDeleteNewsEntries, bulkToggleNewsStatus } from "./actions";
import { RichTextEditor } from "./RichTextEditor";
import Image from "next/image";

export default function NewsClient({ initialEntries, allTags }: { initialEntries: any[], allTags: string[] }) {
  const [entries, setEntries] = React.useState(initialEntries);
  const [modalTarget, setModalTarget] = React.useState<any | 'new' | null>(null);
  const [delTarget, setDelTarget] = React.useState<number | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [filter, setFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"todos" | "1" | "0">("todos");

  const filteredEntries = entries.filter((e) => {
    const term = filter.toLowerCase();
    const matchText = e.titulo.toLowerCase().includes(term) || (e.keywords || "").toLowerCase().includes(term);
    const matchStatus = statusFilter === "todos" ? true : e.estado.toString() === statusFilter;
    return matchText && matchStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.checked) setSelectedIds(new Set(filteredEntries.map(x => x.id)));
     else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: number, checked: boolean) => {
     const next = new Set(selectedIds);
     if (checked) next.add(id); else next.delete(id);
     setSelectedIds(next);
  };

  const handleBulkPublish = async (publish: boolean) => {
     if (selectedIds.size === 0) return;
     const res = await bulkToggleNewsStatus(Array.from(selectedIds), publish);
     if (res.success) window.location.reload();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const pass = window.prompt("Ingresa contraseña para eliminar masivamente:");
    if (!pass) return;
    const res = await bulkDeleteNewsEntries(Array.from(selectedIds), pass);
    if (!res.success) alert(res.error); else window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Noticias y Blog</h1>
          <p className="text-secondary/60">Posicionamiento SEO orgánico y notas informativas.</p>
        </div>
        <Button onClick={() => setModalTarget('new')} className="bg-primary text-secondary font-bold shrink-0">
          <Plus size={20} className="mr-2"/> Nueva Entrada
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm gap-4">
         <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" size={16}/>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar título o keyword..." className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border w-full md:w-64 outline-none focus:border-primary" />
            </div>
            <select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="p-2 text-sm rounded-lg border border-border outline-none">
               <option value="todos">Todos los Estados</option>
               <option value="1">Publicados</option>
               <option value="0">Ocultos</option>
            </select>
         </div>

         {selectedIds.size > 0 && (
           <div className="flex gap-2 items-center bg-secondary/5 px-4 py-2 rounded-lg w-full md:w-auto">
             <span className="text-sm font-bold">{selectedIds.size} seleccionados</span>
             <Button size="sm" variant="outline" className="h-8" onClick={() => handleBulkPublish(true)}>Publicar</Button>
             <Button size="sm" variant="outline" className="h-8" onClick={() => handleBulkPublish(false)}>Ocultar</Button>
             <Button size="sm" variant="outline" className="h-8 border-red-500 text-red-500 hover:bg-red-50" onClick={handleBulkDelete}><Trash2 size={16}/></Button>
           </div>
         )}
      </div>

      <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/5 border-b border-border">
               <tr className="text-secondary/60 uppercase tracking-wider text-xs">
                  <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredEntries.length}/></th>
                  <th className="p-4">Entrada</th>
                  <th className="p-4">Keywords</th>
                  <th className="p-4">Fecha Creación</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 w-32">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {filteredEntries.map(e => (
                 <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4"><input type="checkbox" checked={selectedIds.has(e.id)} onChange={(ev) => handleSelectOne(e.id, ev.target.checked)}/></td>
                    <td className="p-4 flex gap-3 items-center">
                       <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden relative">
                         {e.imagen_portada ? <Image src={e.imagen_portada} alt="" fill className="object-cover"/> : <span className="text-[10px] text-secondary/30">No Img</span>}
                       </div>
                       <div className="truncate max-w-[200px] lg:max-w-xs font-bold text-secondary">{e.titulo}<br/><span className="font-mono text-xs text-secondary/50 font-normal">/{e.slug}</span></div>
                    </td>
                    <td className="p-4">
                       <div className="flex gap-1 flex-wrap max-w-xs">
                         {JSON.parse(e.keywords).map((k: string, i: number) => <span key={i} className="text-[10px] bg-secondary/10 px-2 py-0.5 rounded-full">{k}</span>)}
                       </div>
                    </td>
                    <td className="p-4 text-xs text-secondary/70">{new Date(e.fecha_creacion).toLocaleDateString()}</td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${e.estado === 1 ? 'bg-primary/20 text-green-800' : 'bg-muted text-secondary/60'}`}>
                         {e.estado === 1 ? 'Publicado' : 'Oculto'}
                       </span>
                    </td>
                    <td className="p-4">
                       {delTarget === e.id ? (
                         <div className="flex gap-1 animate-in fade-in zoom-in absolute z-10 bg-white p-2 border border-red-200 rounded-lg shadow-xl right-10 -mt-6">
                            <input type="password" id={`pass_${e.id}`} placeholder="Admin pass" className="w-24 text-xs border p-1 rounded" />
                            <button className="bg-red-500 text-white text-xs px-2 rounded font-bold" onClick={async () => {
                              const pass = (document.getElementById(`pass_${e.id}`) as HTMLInputElement)?.value;
                              const res = await deleteNewsEntry(e.id, pass);
                              if (res.success) window.location.reload(); else alert(res.error);
                            }}>P</button>
                            <button className="bg-muted px-2 rounded text-xs" onClick={() => setDelTarget(null)}>X</button>
                         </div>
                       ) : (
                         <div className="flex gap-2">
                           <button onClick={async () => { await toggleNewsStatus(e.id, e.estado); window.location.reload(); }} className="p-1.5 bg-muted rounded hover:bg-secondary/10 transition-colors" title="Ver/Ocultar">
                              {e.estado === 1 ? <Eye size={16}/> : <EyeOff size={16} className="text-secondary/40"/>}
                           </button>
                           <button onClick={() => setModalTarget(e)} className="p-1.5 bg-muted rounded hover:bg-secondary/10 transition-colors" title="Editar">
                              <Edit size={16}/>
                           </button>
                           <button onClick={() => setDelTarget(e.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors" title="Borrar">
                              <Trash2 size={16}/>
                           </button>
                         </div>
                       )}
                    </td>
                 </tr>
               ))}
               {filteredEntries.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-secondary/50">No hay entradas para este filtro.</td></tr>}
            </tbody>
         </table>
      </div>

      {modalTarget && <NewsModal editEntry={modalTarget === 'new' ? null : modalTarget} onClose={() => setModalTarget(null)} allTags={allTags} />}
    </div>
  );
}

function NewsModal({ onClose, editEntry, allTags }: { onClose: () => void, editEntry?: any, allTags: string[] }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [titulo, setTitulo] = React.useState(editEntry?.titulo || "");
  const [slug, setSlug] = React.useState(editEntry?.slug || "");
  const [cuerpo, setCuerpo] = React.useState(editEntry?.cuerpo || "");
  const [keywords, setKeywords] = React.useState<string[]>(editEntry?.keywords ? JSON.parse(editEntry.keywords) : []);
  const [kwInput, setKwInput] = React.useState("");
  const [fuentes, setFuentes] = React.useState(editEntry?.fuentes || "");

  const handleTitulo = (e: any) => {
     setTitulo(e.target.value);
     if (!editEntry) { // auto slug on creation
        setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
     }
  };

  const addKw = (e: any) => {
     if (e.key === 'Enter') {
       e.preventDefault();
       if (kwInput.trim() && !keywords.includes(kwInput.trim())) {
         setKeywords([...keywords, kwInput.trim()]);
         setKwInput("");
       }
     }
  };

  const removeKw = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const save = async (estado: number) => {
     if(!titulo || !slug || !cuerpo) return alert("Título, Slug y Cuerpo son obligatorios.");
     setIsSubmitting(true);
     try {
       const fd = new FormData();
       fd.append("titulo", titulo);
       fd.append("slug", slug);
       fd.append("cuerpo", cuerpo);
       fd.append("keywords", JSON.stringify(keywords));
       fd.append("fuentes", fuentes);
       fd.append("estado", estado.toString());
       
       const fileInput = document.getElementById('coverImage') as HTMLInputElement;
       if (fileInput?.files?.[0]) {
          fd.append("file", fileInput.files[0]);
       }

       const res = editEntry ? await updateNewsEntry(editEntry.id, fd) : await createNewsEntry(fd);
       if (!res.success) alert(res.error); else { window.location.reload(); }
     } catch(e) {
       alert("Error de red.");
     } finally {
       setIsSubmitting(false);
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur animate-in fade-in">
       <div className="bg-background rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative border border-border">
          <div className="p-6 border-b border-border bg-white flex justify-between items-center shrink-0">
             <h2 className="text-2xl font-black">{editEntry ? 'Editar Publicación' : 'Nueva Publicación'}</h2>
             <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-secondary/10">X</button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Título de la nota</label>
                    <input value={titulo} onChange={handleTitulo} className="w-full p-3 rounded-xl bg-white border border-border outline-none focus:border-primary text-secondary font-bold text-lg" placeholder="Ej: Las maravillas fotovoltaicas..." />
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Slug (URL amigable)</label>
                    <input value={slug} onChange={(e)=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} className="w-full p-2.5 rounded-lg bg-muted text-sm border-none outline-none font-mono text-secondary/70 focus:ring-1 ring-primary" placeholder="maravillas-fotovoltaicas" />
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Etiquetas / Categorías</label>
                    <div className="flex gap-2 mb-2">
                       <select 
                         className="flex-1 p-2.5 rounded-lg bg-white border border-border outline-none text-sm"
                         onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                               const newTag = window.prompt("Nueva Etiqueta:");
                               if (newTag?.trim() && !keywords.includes(newTag.trim())) {
                                 setKeywords([...keywords, newTag.trim()]);
                               }
                            } else if (e.target.value && !keywords.includes(e.target.value)) {
                               setKeywords([...keywords, e.target.value]);
                            }
                            e.target.value = '';
                         }}
                       >
                         <option value="">Seleccionar etiqueta...</option>
                         {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                         <option value="ADD_NEW" className="font-bold text-primary">+ Agregar Nueva...</option>
                       </select>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {keywords.map(k => <span key={k} className="bg-primary/20 text-secondary text-xs px-2 py-1 rounded-full flex gap-1 items-center">{k} <button type="button" onClick={()=>removeKw(k)} className="hover:text-red-500 font-bold ml-1 text-[10px]">X</button></span>)}
                    </div>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Imagen de Portada (Opcional)</label>
                 <div className="bg-muted border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 h-[180px] relative overflow-hidden">
                    {editEntry?.imagen_portada && <Image src={editEntry.imagen_portada} fill alt="Cover" className="object-cover absolute inset-0 opacity-30"/>}
                    <input type="file" id="coverImage" accept="image/*" className="relative z-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-secondary hover:file:bg-primary/80 cursor-pointer w-full text-secondary/60 text-sm"/>
                    <p className="text-[10px] text-secondary/50 relative z-10">Recomendado: 1920x1080px. Máximo 50MB.</p>
                 </div>
               </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Cuerpo del artículo</label>
                <RichTextEditor content={cuerpo} onChange={setCuerpo} />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary/60">Fuentes (Opcional)</label>
                <textarea 
                  value={fuentes} 
                  onChange={(e) => setFuentes(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-white border border-border outline-none focus:border-primary text-secondary text-sm min-h-[80px]" 
                  placeholder="Ej: CNN en Español: https://cnn.com/nota, Wikipedia..." 
                />
             </div>
          </div>

          <div className="p-6 border-t border-border bg-muted/30 flex gap-4 shrink-0 mt-auto">
             <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
             <Button variant="outline" className="flex-1 border-primary/50 text-secondary" onClick={()=>save(0)} disabled={isSubmitting}>Guardar Borrador (Oculto)</Button>
             <Button variant="default" className="flex-1 bg-secondary text-primary" onClick={()=>save(1)} disabled={isSubmitting}>{editEntry ? 'Guardar Cambios' : 'Publicar Ahora'}</Button>
          </div>

          {isSubmitting && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center font-bold text-xl">Guardando...</div>}
       </div>
    </div>
  );
}
