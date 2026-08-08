"use client";

import * as React from "react";
import { Users, Search, Filter, Plus, Calendar, CheckCircle2, AlertTriangle, Presentation, Activity, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDetailModal from "./LeadDetailModal";
import LeadCreateModal from "./LeadCreateModal";
import { updateLeadStage, deleteLeads } from "./actions";

export default function LeadsClient({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = React.useState(initialLeads);
  const [search, setSearch] = React.useState("");
  
  // Filters
  const [filterModality, setFilterModality] = React.useState("Todas");
  const [filterStage, setFilterStage] = React.useState("Todas");
  const [filterStatus, setFilterStatus] = React.useState("Todos");
  const [filterPriority, setFilterPriority] = React.useState("Todas");
  const [filterProject, setFilterProject] = React.useState("Todos");
  const [filterSource, setFilterSource] = React.useState("Todas");
  const [onlyOverdue, setOnlyOverdue] = React.useState(false);
  const [onlyUncontacted, setOnlyUncontacted] = React.useState(false);
  
  // Modals & Selections
  const [activeLead, setActiveLead] = React.useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deletePass, setDeletePass] = React.useState("");
  const [deleteError, setDeleteError] = React.useState("");

  // Sync state if initialLeads changes via Server Action revalidation
  React.useEffect(() => {
    setLeads(initialLeads);
    if (activeLead) {
      const updated = initialLeads.find(l => l.id === activeLead.id);
      if (updated) setActiveLead(updated);
    }
  }, [initialLeads]);

  // Derived Metrics
  const activeLeads = leads.filter(l => l.stage !== 'Ganado' && l.stage !== 'Perdido');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newLeadsCount = leads.filter(l => new Date(l.createdAt) >= sevenDaysAgo).length;
  
  const overdueFollowUps = activeLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date());
  const proposalLeads = activeLeads.filter(l => l.stage === 'Propuesta enviada');
  const wonLeads = leads.filter(l => l.stage === 'Ganado').length;
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) : "0.0";

  // Applied Filters
  const filteredLeads = leads.filter(l => {
    const isOverdue = l.followUpDate && new Date(l.followUpDate) < new Date();
    const isUncontacted = l.status === "Pendiente de contacto";
    
    const matchesSearch = search ? 
      [l.fullName, l.email, l.phone, l.address].some(val => val?.toString().toLowerCase().includes(search.toLowerCase())) 
      : true;
      
    const matchesModality = filterModality === "Todas" || l.modality === filterModality;
    const matchesStage = filterStage === "Todas" || l.stage === filterStage;
    const matchesStatus = filterStatus === "Todos" || l.status === filterStatus;
    const matchesPriority = filterPriority === "Todas" || l.priority === filterPriority;
    const matchesProject = filterProject === "Todos" || l.projectType === filterProject;
    const matchesSource = filterSource === "Todas" || l.source === filterSource;
    
    const matchesOverdue = !onlyOverdue || isOverdue;
    const matchesUncontacted = !onlyUncontacted || isUncontacted;
    
    return matchesSearch && matchesModality && matchesStage && matchesStatus && matchesPriority && matchesProject && matchesSource && matchesOverdue && matchesUncontacted;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredLeads.map((l:any) => l.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const executeDelete = async () => {
    setDeleteError("");
    const res = await deleteLeads(selectedIds, deletePass);
    if (res?.success) {
      setSelectedIds([]);
      setIsDeleting(false);
      setDeletePass("");
    } else {
      setDeleteError(res?.error || "Error desconocido");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Fecha", "Nombre/Empresa", "Celular", "Correo", "Modalidad", "Etapa", "Estado", "Prioridad", "Tipo de Proyecto", "Fuente"];
    const rows = filteredLeads.map((l:any) => [
      l.id,
      new Date(l.createdAt).toLocaleDateString('es-CO'),
      `"${l.fullName}"`,
      l.phone,
      l.email || "",
      l.modality,
      l.stage,
      l.status,
      l.priority,
      l.projectType || "",
      l.source
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Leads_Filtrados_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Leads & CRM</h1>
          <p className="text-secondary/60">Gestiona íntegramente todo tu pipeline de ventas y contactos.</p>
        </div>
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
             <Download size={18}/> Exportar CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus size={18}/> Agregar Lead Manual
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-secondary/50 mb-4"><Activity size={18}/><span className="text-xs font-bold uppercase tracking-wider">Activos</span></div>
           <div className="text-3xl font-black text-secondary">{activeLeads.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-secondary/50 mb-4"><Users size={18}/><span className="text-xs font-bold uppercase tracking-wider">Últimos 7 Días</span></div>
           <div className="text-3xl font-black text-primary">{newLeadsCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-secondary/50 mb-4"><Presentation size={18}/><span className="text-xs font-bold uppercase tracking-wider">Propuestas Env.</span></div>
           <div className="text-3xl font-black text-secondary">{proposalLeads.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full" />
           <div className="flex items-center gap-2 text-red-500 mb-4"><AlertTriangle size={18}/><span className="text-xs font-bold uppercase tracking-wider">Vencidos</span></div>
           <div className="text-3xl font-black text-red-600">{overdueFollowUps.length}</div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-green-500/20 shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-green-600 mb-4"><CheckCircle2 size={18}/><span className="text-xs font-bold uppercase tracking-wider">Conversión</span></div>
           <div className="text-3xl font-black text-green-600">{conversionRate}%</div>
         </div>
      </div>

      <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 items-center justify-between bg-muted/30">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar cliente, teléfono..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white" 
              />
            </div>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="Todas">Etapas</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Contactado">Contactado</option>
              <option value="En análisis">En análisis</option>
              <option value="Propuesta enviada">Propuesta enviada</option>
              <option value="Negociación">Negociación</option>
              <option value="Ganado">Ganado</option>
              <option value="Perdido">Perdido</option>
            </select>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="Todos">Estados</option>
              <option value="Pendiente de contacto">Pdte. contacto</option>
              <option value="Esperando respuesta">En espera</option>
              <option value="Requiere seguimiento">Requiere follow</option>
              <option value="Cerrado">Cerrado</option>
            </select>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="Todas">Prioridad</option>
              <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
            </select>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterModality} onChange={e => setFilterModality(e.target.value)}>
              <option value="Todas">Modalidad</option>
              <option value="express">Express</option>
              <option value="manual">Manual</option>
              <option value="detailed">Detallada</option>
            </select>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="Todos">Proyecto</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Media Tensión">Media Tensión</option>
            </select>
            
            <select className="px-3 py-2 border border-border rounded-xl text-sm bg-white outline-none cursor-pointer text-secondary/70 shrink-0"
              value={filterSource} onChange={e => setFilterSource(e.target.value)}>
              <option value="Todas">Fuentes</option>
              <option value="Web">Web</option>
              <option value="Manual">Manual</option>
              <option value="API">APIEx</option>
            </select>
            
            <div className="flex items-center gap-4 border border-border px-4 py-2 rounded-xl bg-white shrink-0 ml-auto">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-secondary/70 hover:text-secondary">
                <input type="checkbox" checked={onlyOverdue} onChange={e=>setOnlyOverdue(e.target.checked)} className="accent-red-500 w-4 h-4 rounded text-red-500"/>
                Vencidos🚨
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-secondary/70 hover:text-secondary">
                <input type="checkbox" checked={onlyUncontacted} onChange={e=>setOnlyUncontacted(e.target.checked)} className="accent-primary w-4 h-4 rounded text-primary"/>
                Incontactados
              </label>
            </div>
          </div>
        </div>
        
        {/* Selection Execution Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
             <span className="text-sm font-bold text-primary">{selectedIds.length} lead(s) seleccionado(s)</span>
             <Button variant="default" size="sm" onClick={() => setIsDeleting(true)} className="gap-2 h-8 bg-red-500 hover:bg-red-600 border-none text-white shadow-md">
               <Trash2 size={14}/> Eliminar Selección
             </Button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/5 text-secondary/60 uppercase tracking-widest text-[#10px] sm:text-xs font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input type="checkbox" className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    checked={filteredLeads.length > 0 && selectedIds.length === filteredLeads.length}
                    onChange={handleSelectAll} 
                  />
                </th>
                <th className="px-6 py-4">Fecha / Fuente</th>
                <th className="px-6 py-4">Cliente / Contacto</th>
                <th className="px-6 py-4">Pipeline</th>
                <th className="px-6 py-4">Tipología</th>
                <th className="px-6 py-4">Seguimiento</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead: any) => {
                const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();
                const isUrgentNew = lead.stage === 'Nuevo' && (new Date().getTime() - new Date(lead.createdAt).getTime() > 7*24*60*60*1000);
                
                return (
                  <tr key={lead.id} className={`hover:bg-muted/30 transition-colors group cursor-pointer ${selectedIds.includes(lead.id) ? 'bg-primary/5' : ''}`} onClick={() => setActiveLead(lead)}>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                       <input type="checkbox" className="accent-primary w-4 h-4 rounded cursor-pointer"
                         checked={selectedIds.includes(lead.id)}
                         onChange={() => {}} 
                         onClick={(e) => handleSelectOne(e, lead.id)}
                       />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-secondary">{new Date(lead.createdAt).toLocaleDateString('es-CO')}</div>
                      <div className="text-xs text-secondary/50 font-medium">#{lead.id} · {lead.source}</div>
                      {isUrgentNew && <div className="text-[10px] font-bold text-red-500 uppercase mt-1">Stale Lead</div>}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-black text-secondary flex items-center gap-2">
                        {lead.fullName} 
                        {lead.priority === 'Alta' && <span className="w-2 h-2 rounded-full bg-red-500 shadow" title="Prioridad Alta"/>}
                      </div>
                      <div className="text-xs text-secondary/70">{lead.phone}</div>
                    </td>
                    
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                       <select 
                         className="bg-primary/5 border border-primary/20 text-primary font-bold text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                         value={lead.stage}
                         onChange={(e) => updateLeadStage(lead.id, e.target.value, lead.status)}
                       >
                         <option value="Nuevo">Nuevo</option>
                         <option value="Contactado">Contactado</option>
                         <option value="En análisis">En análisis</option>
                         <option value="Propuesta enviada">Propuesta enviada</option>
                         <option value="Negociación">Negociación</option>
                         <option disabled>──────────</option>
                         <option value="Ganado">✓ Ganado</option>
                         <option value="Perdido">✗ Perdido</option>
                       </select>
                       <div className="text-[10px] text-secondary/50 mt-1 uppercase tracking-wider">{lead.status}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                       <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            lead.modality === "express" ? "bg-blue-100 text-blue-700" :
                            lead.modality === "manual" ? "bg-green-100 text-green-700" :
                            lead.modality === "detailed" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                          }`}>{lead.modality}</span>
                          <span className="text-xs text-secondary/60">{lead.projectType || "No asignado"}</span>
                       </div>
                    </td>

                    <td className="px-6 py-4">
                       {lead.followUpDate ? (
                         <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border ${isOverdue ? 'bg-red-50 border-red-200 text-red-600' : 'bg-secondary/5 border-border text-secondary/70'}`}>
                           <Calendar size={14}/> {new Date(lead.followUpDate).toLocaleDateString('es-CO')}
                         </div>
                       ) : <span className="text-secondary/30 text-xs">—</span>}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" className="font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setActiveLead(lead); }}>
                        Ver Tablero
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
             <div className="text-center py-20 text-secondary/50 font-light flex flex-col items-center">
                <Users size={40} className="mb-4 text-secondary/20"/>
                <p className="text-lg">No hay leads que coincidan con la búsqueda.</p>
             </div>
          )}
        </div>
      </div>

      {activeLead && <LeadDetailModal lead={activeLead} onClose={() => setActiveLead(null)} />}
      {isCreateOpen && <LeadCreateModal onClose={() => setIsCreateOpen(false)} />}
      
      {/* Delete Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-border text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32}/></div>
            <h3 className="text-xl font-black text-secondary tracking-tight mb-2">Confirmar Eliminación</h3>
            <p className="text-sm text-secondary/60 mb-6">Vas a eliminar permanentemente <b>{selectedIds.length} lead(s)</b> de la base de datos local junto con sus notas. Esta acción es irreversible.</p>
            
            <div className="space-y-4">
               <div>
                 <input 
                   type="password" 
                   value={deletePass}
                   onChange={e => setDeletePass(e.target.value)}
                   placeholder="Contraseña de Admin..." 
                   className="w-full border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm text-center tracking-widest"
                 />
                 {deleteError && <p className="text-xs text-red-500 font-bold mt-2">{deleteError}</p>}
               </div>
               
               <div className="flex gap-2">
                 <Button variant="ghost" className="flex-1" onClick={() => { setIsDeleting(false); setDeleteError(""); }}>Cancelar</Button>
                 <Button variant="default" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={executeDelete}>Eliminar</Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
