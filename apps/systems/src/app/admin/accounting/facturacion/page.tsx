"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Download, Edit, Trash2, FileText, CreditCard, X, Loader2, FileDown, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { InvoiceModal } from "./components/InvoiceModal";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Borrador":"bg-gray-100 text-gray-600 border-gray-200","Enviada":"bg-blue-100 text-blue-700 border-blue-200",
  "Parcialmente pagada":"bg-amber-100 text-amber-700 border-amber-200","Pagada":"bg-green-100 text-green-700 border-green-200",
  "Vencida":"bg-red-100 text-red-700 border-red-200","Anulada":"bg-red-50 text-red-400 border-red-100",
};
const fmt = (n: number) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(n);
const addDays = (dateStr: string, days: number) => { const d=new Date(dateStr); d.setDate(d.getDate()+days); return d.toISOString().split("T")[0]; };

interface PayPanelState { isOpen:boolean; invoice:any|null; payments:any[]; isLoading:boolean; }

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState<"emitted"|"received">("emitted");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any|null>(null);
  const [payPanel, setPayPanel] = useState<PayPanelState>({isOpen:false,invoice:null,payments:[],isLoading:false});
  const [payForm, setPayForm] = useState({amount:"",date:new Date().toISOString().split("T")[0],method:"Transferencia",reference:""});
  const [isSavingPay, setIsSavingPay] = useState(false);

  // PDF Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfState, setPdfState] = useState<"idle"|"loading"|"preview">("idle");
  const [pdfData, setPdfData] = useState<any>(null);
  const [pdfError, setPdfError] = useState("");

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounting/invoices?type=${activeTab}`);
      const j = await res.json();
      if(j.success) setInvoices(j.data.filter((i:any)=>i.status!=="Anulada"));
    } finally { setIsLoading(false); }
  };
  useEffect(()=>{ fetchInvoices(); },[activeTab]);

  const handleDelete = async (id:number) => {
    if(!confirm("¿Anular esta factura?")) return;
    await fetch(`/api/accounting/invoices/${id}`,{method:"DELETE"});
    fetchInvoices();
  };

  const openPayPanel = async (inv:any) => {
    setPayPanel({isOpen:true,invoice:inv,payments:[],isLoading:true});
    setPayForm({amount:"",date:new Date().toISOString().split("T")[0],method:"Transferencia",reference:""});
    const j = await fetch(`/api/accounting/invoices/${inv.id}/pay`).then(r=>r.json());
    setPayPanel(p=>({...p,payments:j.success?j.data:[],isLoading:false}));
  };
  const handleRegisterPayment = async () => {
    if(!payPanel.invoice||!payForm.amount) return;
    setIsSavingPay(true);
    const j = await fetch(`/api/accounting/invoices/${payPanel.invoice.id}/pay`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...payForm,amount:parseFloat(payForm.amount)}),
    }).then(r=>r.json());
    if(j.success){
      const pj = await fetch(`/api/accounting/invoices/${payPanel.invoice.id}/pay`).then(r=>r.json());
      setPayPanel(p=>({...p,payments:pj.success?pj.data:[]}));
      setPayForm({amount:"",date:new Date().toISOString().split("T")[0],method:"Transferencia",reference:""});
      fetchInvoices();
    }
    setIsSavingPay(false);
  };

  // ── PDF Import ─────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setPdfError(""); setPdfState("loading");
    const fd = new FormData(); fd.append("file", file);
    try {
      const j = await fetch("/api/accounting/invoices/import-pdf",{method:"POST",body:fd}).then(r=>r.json());
      if(j.success){ 
        setPdfData(j); 
        setPdfState("preview"); 
      }
      else { 
        setPdfError(j.error||"Error al procesar el PDF"); 
        setPdfState("idle"); 
      }
    } catch { setPdfError("Error de conexión"); setPdfState("idle"); }
    if(fileInputRef.current) fileInputRef.current.value="";
  };

  const handleConfirmImport = async () => {
    if(!pdfData || !pdfData.data) return;
    const data = pdfData.data;

    const issueDate = data.issue_date || new Date().toISOString().split("T")[0];
    const dueDate   = data.due_date   || addDays(issueDate, 30);
    const items = data.items?.length > 0
      ? data.items.map((it:any)=>({ description:it.description, quantity:it.quantity||1, unit_price:it.unit_price||0, discount_pct:0, tax_id:"1" }))
      : [{ description:"Servicios (extraído de PDF)", quantity:1, unit_price:data.subtotal||data.total||0, discount_pct:0, tax_id:"1" }];

    const metadata = pdfData.metadata || {};
    const tpId = data.third_party_id || "";
    const tpName = data.third_party_name || "";
    const tpCreated = data.third_party_created;
    
    // Do NOT pass an `id` — InvoiceModal uses !!initialData?.id to decide POST vs PUT
    setEditingItem({
      type: activeTab,
      third_party_id: tpId,
      issue_date: issueDate,
      due_date: dueDate,
      currency: data.currency || "COP",
      discount: 0,
      notes: `Importado automáticamente de PDF. Confianza: ${metadata.confidence||0}%. Método: ${metadata.parser_used||"N/A"}. Factura N°: ${data.invoice_number||"—"}`,
      terms: "",
      items,
      _importedFrom: "pdf",
      _matchedThirdParty: tpName || null,
      _thirdPartyCreated: tpCreated,
      _validation: pdfData.validation
    });
    setPdfState("idle"); setPdfData(null);
    setIsModalOpen(true);
  };

  const filtered = invoices.filter(i=>
    i.number?.toLowerCase().includes(search.toLowerCase())||
    i.third_party_name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalAmount = filtered.reduce((a:number,i:any)=>a+(i.total||0),0);
  const totalPaid   = filtered.filter((i:any)=>i.status==="Pagada").reduce((a:number,i:any)=>a+(i.total||0),0);
  const totalPending= filtered.filter((i:any)=>["Enviada","Parcialmente pagada","Vencida"].includes(i.status)).reduce((a:number,i:any)=>a+(i.total||0),0);

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange}/>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Facturación</h2>
          <p className="text-muted-foreground text-sm mt-1">Gestión de facturas emitidas y recibidas.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>window.open(`/api/accounting/export?entity=invoices&type=${activeTab}`,"_blank")}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary/5 transition-colors text-foreground">
            <Download size={16}/><span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button onClick={()=>fileInputRef.current?.click()} disabled={pdfState==="loading"}
            className="flex items-center gap-2 bg-secondary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60">
            {pdfState==="loading" ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
            <span className="hidden sm:inline">Importar Siigo PDF</span>
          </button>
          <button onClick={()=>{setEditingItem(null);setIsModalOpen(true);}}
            className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16}/><span className="hidden sm:inline">Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* PDF Error */}
      {pdfError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={15}/> {pdfError}
          <button onClick={()=>setPdfError("")} className="ml-auto"><X size={14}/></button>
        </div>
      )}

      {/* PDF Preview Card */}
      {pdfState==="preview" && pdfData?.data && (
        <div className={`bg-blue-50 border ${pdfData.validation?.isValid ? 'border-blue-200' : 'border-amber-400 bg-amber-50'} rounded-xl p-5 space-y-4`}>
          <div className="flex items-center gap-2">
            {pdfData.validation?.isValid ? (
              <CheckCircle size={18} className="text-blue-600"/>
            ) : (
              <AlertCircle size={18} className="text-amber-600"/>
            )}
            <h4 className={`font-semibold ${pdfData.validation?.isValid ? 'text-blue-800' : 'text-amber-800'}`}>
              {pdfData.validation?.isValid ? 'PDF procesado correctamente' : 'Revisa los datos extraídos'}
            </h4>
            <div className="flex gap-2 ml-auto">
              <span className="text-xs px-2 py-1 rounded bg-white border border-blue-100 text-blue-600">Confianza: {pdfData.metadata?.confidence}%</span>
              {pdfData.data.third_party_created && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 border border-green-200 text-green-700">
                  {activeTab==="emitted" ? "Cliente" : "Proveedor"} creado automáticamente
                </span>
              )}
              {pdfData.data.third_party_id && !pdfData.data.third_party_created && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 border border-green-200 text-green-700">
                  {activeTab==="emitted" ? "Cliente" : "Proveedor"} encontrado
                </span>
              )}
              <button onClick={()=>{setPdfState("idle");setPdfData(null);}} className="text-blue-400 hover:text-blue-700"><X size={16}/></button>
            </div>
          </div>
          
          {!pdfData.validation?.isValid && (
            <div className="text-sm text-amber-700 mb-2">
              ⚠️ Algunos datos no se detectaron o tienen inconsistencias.
              {pdfData.validation?.missingFields?.length > 0 && <span className="block font-medium">Campos faltantes: {pdfData.validation.missingFields.join(", ")}</span>}
              {pdfData.validation?.warnings?.length > 0 && <span className="block">{pdfData.validation.warnings.join(". ")}</span>}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              {label:"Emisor",           val:pdfData.data.issuer_name   ||"—"},
              {label:"NIT Emisor",       val:pdfData.data.issuer_nit    ||"—"},
              {label:activeTab==="emitted"?"Cliente":"Proveedor", val:pdfData.data.third_party_name || pdfData.data.client_name || pdfData.data.issuer_name ||"—"},
              {label:activeTab==="emitted"?"NIT Cliente":"NIT Proveedor", val:activeTab==="emitted" ? (pdfData.data.client_nit||"—") : (pdfData.data.issuer_nit||"—")},
              {label:"N° Factura",       val:pdfData.data.invoice_number||"—"},
              {label:"Fecha Emisión",    val:pdfData.data.issue_date    ||"—"},
              {label:"Fecha Vencimiento",val:pdfData.data.due_date      ||"—"},
              {label:"Subtotal",         val:fmt(pdfData.data.subtotal  ||0)},
              {label:"IVA",              val:fmt(pdfData.data.tax_total ||0)},
              {label:"Total a Pagar",    val:fmt(pdfData.data.total     ||0)},
              {label:"Ítems detectados", val:`${pdfData.data.items?.length||0}`},
            ].map(f=>(
              <div key={f.label} className="bg-white border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-400 font-medium">{f.label}</p>
                <p className="font-semibold text-blue-900 truncate">{f.val}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleConfirmImport}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <FileText size={15}/> Abrir en formulario para revisar y guardar
            </button>
            <button onClick={()=>{setPdfState("idle");setPdfData(null);}}
              className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-white transition-colors">
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Total Facturado",val:fmt(totalAmount),color:"text-foreground"},
          {label:"Cobrado / Pagado",val:fmt(totalPaid),color:"text-green-600"},
          {label:"Pendiente",val:fmt(totalPending),color:"text-amber-600"},
        ].map(k=>(
          <div key={k.label} className="bg-background border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
            <p className={`text-lg font-bold mt-1 ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["emitted","Emitidas"],["received","Recibidas"]] as const).map(([val,label])=>(
          <button key={val} onClick={()=>{setActiveTab(val);setSearch("");}}
            className={cn("flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative",
              activeTab===val?"text-primary":"text-muted-foreground hover:text-foreground")}>
            <FileText size={16}/>{label}
            {activeTab===val && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"/>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
        <input type="text" placeholder="Buscar por número o nombre..." value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/5 text-muted-foreground font-medium border-b border-border text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Número</th>
              <th className="px-4 py-3 text-left">{activeTab==="emitted"?"Cliente":"Proveedor"}</th>
              <th className="px-4 py-3 text-left">Emisión</th>
              <th className="px-4 py-3 text-left">Vencimiento</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading?(<tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Cargando...</td></tr>)
            :filtered.length===0?(<tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No hay facturas registradas.</td></tr>)
            :filtered.map(inv=>(
              <tr key={inv.id} className="border-b border-border hover:bg-secondary/5 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.number}</td>
                <td className="px-4 py-3 font-medium text-foreground">{inv.third_party_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.issue_date?.slice(0,10)}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.due_date?.slice(0,10)}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(inv.total)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border",STATUS_COLORS[inv.status]||"")}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/accounting/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" title="Descargar PDF"
                      className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"><FileDown size={15}/></a>
                    {inv.status!=="Pagada" && activeTab==="emitted" && (
                      <button onClick={()=>openPayPanel(inv)} title="Registrar pago"
                        className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors"><CreditCard size={15}/></button>
                    )}
                    <button onClick={()=>{setEditingItem(inv);setIsModalOpen(true);}} className="p-1.5 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"><Edit size={15}/></button>
                    <button onClick={()=>handleDelete(inv.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSuccess={fetchInvoices} initialType={activeTab} initialData={editingItem}/>

      {/* Payment Panel */}
      {payPanel.isOpen && payPanel.invoice && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setPayPanel(p=>({...p,isOpen:false}))}/>
          <div className="w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-foreground">Pagos — {payPanel.invoice.number}</h3>
                <p className="text-xs text-muted-foreground">Total: {fmt(payPanel.invoice.total)}</p>
              </div>
              <button onClick={()=>setPayPanel(p=>({...p,isOpen:false}))} className="p-2 hover:bg-secondary/10 rounded-full"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-3">Historial de Pagos</h4>
                {payPanel.isLoading?(<p className="text-sm text-muted-foreground">Cargando...</p>)
                :payPanel.payments.length===0?(<p className="text-sm text-muted-foreground italic">Sin pagos aún.</p>)
                :(
                  <div className="space-y-2">
                    {payPanel.payments.map((p:any)=>(
                      <div key={p.id} className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
                        <div className="flex justify-between font-semibold text-green-700"><span>{fmt(p.amount)}</span><span>{p.date?.slice(0,10)}</span></div>
                        <div className="text-green-600">{p.method}{p.reference?` — Ref: ${p.reference}`:""}</div>
                      </div>
                    ))}
                    <div className="text-xs font-bold text-green-700 text-right pt-1 border-t border-border">
                      Total pagado: {fmt(payPanel.payments.reduce((a:number,p:any)=>a+p.amount,0))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-5">
                <h4 className="text-sm font-semibold mb-4">Registrar Pago</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Monto *</label>
                      <input type="number" step="0.01" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}
                        placeholder="0" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Fecha *</label>
                      <input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Método</label>
                    <select value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                      {["Transferencia","Efectivo","Tarjeta de Crédito","Tarjeta de Débito","Cheque"].map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Referencia</label>
                    <input value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))} placeholder="TXN-123"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                  </div>
                  <button onClick={handleRegisterPayment} disabled={isSavingPay||!payForm.amount}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
                    {isSavingPay?<Loader2 size={16} className="animate-spin"/>:<CreditCard size={16}/>} Registrar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
