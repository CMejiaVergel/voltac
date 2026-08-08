"use client";

import * as React from "react";
import { Settings, Trash2, ArrowLeft, RefreshCcw, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeletedLeads } from "./actions";
import { restoreLeads, permanentDeleteLeads } from "@/app/admin/leads/actions";

export default function ConfiguracionPage() {
  const [view, setView] = React.useState<"main" | "auth" | "bin">("main");
  const [pass, setPass] = React.useState("");
  const [error, setError] = React.useState("");
  
  const [deletedLeads, setDeletedLeads] = React.useState<any[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAuth = async () => {
    setIsProcessing(true);
    setError("");
    const res = await getDeletedLeads(pass);
    if (res.success) {
      setDeletedLeads(res.data || []);
      setView("bin");
      setPass(""); // clear memory
    } else {
      setError(res.error || "Error de validación");
    }
    setIsProcessing(false);
  };

  const handleRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await restoreLeads(selectedIds);
    // Refresh UI list
    setDeletedLeads(deletedLeads.filter(l => !selectedIds.includes(l.id)));
    setSelectedIds([]);
    setIsProcessing(false);
    alert("Leads restaurados al CRM de manera exitosa.");
  };

  const handleHardDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmPass = prompt("Ingresa la contraseña admin para PURGAR estos leads irreversiblemente:");
    if (!confirmPass) return;
    setIsProcessing(true);
    const res = await permanentDeleteLeads(selectedIds, confirmPass);
    if (res.success) {
      setDeletedLeads(deletedLeads.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
      alert("Leads oxidados y purgados permanentemente.");
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(false);
  };

  if (view === "auth") {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-3xl border border-border shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon size={32}/></div>
        <h2 className="text-2xl font-black text-secondary tracking-tight mb-2">Bóveda Privada</h2>
        <p className="text-secondary/60 text-sm mb-6">Para acceder a la papelera de reciclaje y auditar leads ocultos, ingresa tu código.</p>
        
        <input 
          type="password" 
          value={pass} 
          onChange={e => setPass(e.target.value)} 
          className="w-full border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-center tracking-widest mb-4"
          placeholder="Código de acceso..."
        />
        {error && <p className="text-xs text-red-500 font-bold mb-4">{error}</p>}
        
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setView("main")} className="flex-1">Cancelar</Button>
          <Button variant="default" onClick={handleAuth} disabled={isProcessing} className="flex-1 bg-secondary text-white">Validar</Button>
        </div>
      </div>
    );
  }

  if (view === "bin") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setView("main")}><ArrowLeft size={18}/> Regresar</Button>
          <div>
            <h1 className="text-3xl font-black text-secondary tracking-tight">Papelera de Reciclaje</h1>
            <p className="text-secondary/60">Leads eliminados del CRM general. Se conservan aquí según las normativas de retención de datos.</p>
          </div>
        </div>

        {selectedIds.length > 0 && (
           <div className="flex gap-2 items-center bg-muted/50 p-3 rounded-xl border border-border">
             <span className="text-sm font-bold ml-2 mr-4">{selectedIds.length} seleccionados</span>
             <Button size="sm" variant="default" onClick={handleRestore} disabled={isProcessing} className="bg-primary hover:bg-primary/90 gap-2"><RefreshCcw size={16}/> Restaurar al CRM</Button>
             <Button size="sm" variant="default" onClick={handleHardDelete} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 gap-2"><Trash2 size={16}/> Purgar Definitivamente</Button>
           </div>
        )}

        <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/5 text-secondary/60 uppercase tracking-widest text-xs font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input type="checkbox" className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    checked={deletedLeads.length > 0 && selectedIds.length === deletedLeads.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? deletedLeads.map(l => l.id) : [])} 
                  />
                </th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente / Contacto</th>
                <th className="px-6 py-4">Fecha de Solicitud</th>
                <th className="px-6 py-4">Etapa Previa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deletedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-secondary/40 font-bold">La papelera está completamente vacía.</td>
                </tr>
              ) : (
                deletedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-center">
                       <input type="checkbox" className="accent-primary w-4 h-4 rounded cursor-pointer"
                         checked={selectedIds.includes(lead.id)}
                         onChange={(e) => {
                           if (e.target.checked) setSelectedIds([...selectedIds, lead.id]);
                           else setSelectedIds(selectedIds.filter(id => id !== lead.id));
                         }} 
                       />
                    </td>
                    <td className="px-6 py-4 font-bold text-secondary/40">#{lead.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{lead.fullName}</div>
                      <div className="text-xs text-secondary/60">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-secondary/80">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className="text-[10px] bg-muted px-2 py-1 rounded font-bold uppercase">{lead.stage}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-secondary tracking-tight">Configuración del Sistema</h1>
        <p className="text-secondary/60">Administra módulos sensibles y parámetros de la plataforma de Voltac Energy.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setView("auth")}>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-secondary">Recycle Bin</h3>
            <p className="text-sm text-secondary/60 mt-1">Bóveda de registros de clientes y solicitudes eliminadas por los asesores. Acceso protegido.</p>
          </div>
        </div>
        
        <div className="bg-white/50 p-6 rounded-2xl border border-border border-dashed flex flex-col justify-between opacity-50 cursor-not-allowed">
          <div className="w-12 h-12 bg-muted text-secondary/50 rounded-xl flex items-center justify-center mb-4">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-secondary">Ajustes de API REST</h3>
            <p className="text-sm text-secondary/60 mt-1">Gestión de llaves maestras para conexión con n8n. (Próximamente)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
