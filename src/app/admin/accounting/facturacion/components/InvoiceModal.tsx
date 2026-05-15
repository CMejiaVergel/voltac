"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Loader2, Plus, Trash2, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TAX_RATES: Record<string, number> = { "1": 19, "2": 5, "3": 0 };
const TAX_OPTIONS = [
  { id: "", label: "Sin impuesto" },
  { id: "1", label: "IVA 19%" },
  { id: "2", label: "IVA 5%" },
  { id: "3", label: "Excluido 0%" },
];
const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

interface InvoiceItem { description: string; quantity: number; unit_price: number; discount_pct: number; tax_id: string; }
interface InvoiceFormData {
  type: "emitted" | "received"; third_party_id: string;
  issue_date: string; due_date: string; currency: string;
  discount: number; notes: string; terms: string; items: InvoiceItem[];
}
interface QuickForm { name: string; document_type: string; document_number: string; email: string; phone: string; }
interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialType?: "emitted" | "received"; initialData?: any; }

export function InvoiceModal({ isOpen, onClose, onSuccess, initialType = "emitted", initialData }: Props) {
  const isEditing = !!initialData?.id;   // PDF-imported data has no id → must POST, not PUT
  const [clients, setClients]     = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const submittedRef = useRef(false);

  // Quick-create inline panel
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickForm, setQuickForm] = useState<QuickForm>({ name: "", document_type: "NIT", document_number: "", email: "", phone: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");

  const defaultItem: InvoiceItem = { description: "", quantity: 1, unit_price: 0, discount_pct: 0, tax_id: "" };

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } =
    useForm<InvoiceFormData>({
      defaultValues: {
        type: initialType, third_party_id: "",
        issue_date: new Date().toISOString().split("T")[0], due_date: "",
        currency: "COP", discount: 0, notes: "", terms: "", items: [defaultItem],
      },
    });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems   = watch("items");
  const watchedType    = watch("type");
  const watchedDiscount = Number(watch("discount")) || 0;
  const watchedTP      = watch("third_party_id");

  const subtotal = watchedItems.reduce((a, i) => a + (Number(i.quantity)||0) * (Number(i.unit_price)||0) * (1-(Number(i.discount_pct)||0)/100), 0);
  const taxTotal = watchedItems.reduce((a, i) => {
    const base = (Number(i.quantity)||0) * (Number(i.unit_price)||0) * (1-(Number(i.discount_pct)||0)/100);
    return a + base * ((i.tax_id ? TAX_RATES[i.tax_id] || 0 : 0) / 100);
  }, 0);
  const total = subtotal + taxTotal - subtotal * (watchedDiscount / 100);

  const thirdParties = watchedType === "emitted" ? clients : suppliers;
  const tpLabel = watchedType === "emitted" ? "Cliente" : "Proveedor";

  const fetchLists = async () => {
    const [cj, sj] = await Promise.all([
      fetch("/api/accounting/clients").then(r => r.json()),
      fetch("/api/accounting/suppliers").then(r => r.json()),
    ]);
    if (cj.success) setClients(cj.data.filter((x: any) => x.is_active));
    if (sj.success) setSuppliers(sj.data.filter((x: any) => x.is_active));
  };

  useEffect(() => {
    if (!isOpen) { submittedRef.current = false; setSaveError(""); setShowQuickCreate(false); setCreateSuccess(""); return; }
    fetchLists();
    if (initialData) reset(initialData);
    else reset({ type: initialType, third_party_id: "", issue_date: new Date().toISOString().split("T")[0], due_date: "", currency: "COP", discount: 0, notes: "", terms: "", items: [defaultItem] });
  }, [isOpen, initialData, initialType, reset]);

  // ── Quick-create client or supplier ──────────────────────────────────────
  const handleQuickCreate = async () => {
    if (!quickForm.name.trim()) return;
    setIsCreating(true);
    setCreateSuccess("");
    const endpoint = watchedType === "emitted" ? "/api/accounting/clients" : "/api/accounting/suppliers";
    try {
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quickForm, is_active: 1, tax_regime: "Responsable de IVA" }),
      });
      const j = await res.json();
      if (j.success) {
        await fetchLists();
        setValue("third_party_id", String(j.data?.id || j.data?.lastID || ""));
        setCreateSuccess(`${tpLabel} "${quickForm.name}" creado correctamente.`);
        setShowQuickCreate(false);
        setQuickForm({ name: "", document_type: "NIT", document_number: "", email: "", phone: "" });
      } else {
        alert(j.error || `Error al crear ${tpLabel.toLowerCase()}`);
      }
    } catch { alert("Error de conexión"); }
    finally { setIsCreating(false); }
  };

  if (!isOpen) return null;

  const onSubmit = async (data: InvoiceFormData) => {
    if (submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    setIsSubmitting(true); setSaveError("");
    const payload = { ...data, subtotal, tax_total: taxTotal, total, discount: Number(data.discount) || 0 };
    const url    = isEditing ? `/api/accounting/invoices/${initialData.id}` : "/api/accounting/invoices";
    const method = isEditing ? "PUT" : "POST";
    try {
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (res.ok || json?.success) { onSuccess(); onClose(); }
      else {
        setSaveError(json?.error || "Error al guardar la factura.");
        setIsSubmitting(false);
        if (res.status < 500) submittedRef.current = false;
      }
    } catch { setSaveError("Error de conexión."); setIsSubmitting(false); submittedRef.current = false; }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">{isEditing?"Editar":"Nueva"} Factura {watchedType==="emitted"?"Emitida":"Recibida"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary/10 rounded-full"><X size={20} className="text-muted-foreground"/></button>
        </div>

        <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* Top row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select {...register("type",{required:true})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground">
                  <option value="emitted">Emitida</option>
                  <option value="received">Recibida</option>
                </select>
              </div>

              {/* Third-party with inline create */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{tpLabel} *</label>
                  <button type="button" onClick={()=>{setShowQuickCreate(v=>!v);setCreateSuccess("");}}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                    <UserPlus size={13}/> Nuevo {tpLabel}
                  </button>
                </div>
                <select {...register("third_party_id",{required:`Selecciona un ${tpLabel.toLowerCase()}`})}
                  className={cn("w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none text-foreground",errors.third_party_id?"border-red-500":"border-border")}>
                  <option value="">Seleccionar...</option>
                  {thirdParties.map(tp=><option key={tp.id} value={String(tp.id)}>{tp.name}</option>)}
                </select>
                {errors.third_party_id && <p className="text-red-500 text-xs mt-1">{errors.third_party_id.message}</p>}

                {/* Success badge */}
                {createSuccess && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <CheckCircle size={12}/>{createSuccess}
                  </div>
                )}

                {/* Quick-create panel */}
                {showQuickCreate && (
                  <div className="mt-3 bg-secondary/5 border border-border rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Crear nuevo {tpLabel}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Nombre / Razón Social *</label>
                        <input value={quickForm.name} onChange={e=>setQuickForm(f=>({...f,name:e.target.value}))} placeholder={`Ej. ${tpLabel} S.A.S`}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Tipo Documento</label>
                        <select value={quickForm.document_type} onChange={e=>setQuickForm(f=>({...f,document_type:e.target.value}))}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none text-foreground">
                          {["NIT","CC","CE","Pasaporte"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Número Documento</label>
                        <input value={quickForm.document_number} onChange={e=>setQuickForm(f=>({...f,document_number:e.target.value}))} placeholder="900.123.456-1"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Email</label>
                        <input type="email" value={quickForm.email} onChange={e=>setQuickForm(f=>({...f,email:e.target.value}))} placeholder="contacto@empresa.com"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Teléfono</label>
                        <input value={quickForm.phone} onChange={e=>setQuickForm(f=>({...f,phone:e.target.value}))} placeholder="+57 300 0000000"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"/>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button type="button" onClick={()=>setShowQuickCreate(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-background text-foreground">Cancelar</button>
                      <button type="button" onClick={handleQuickCreate} disabled={isCreating||!quickForm.name.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">
                        {isCreating?<Loader2 size={12} className="animate-spin"/>:<UserPlus size={12}/>} Crear y seleccionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Emisión *</label>
                <input type="date" {...register("issue_date",{required:true})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label>
                <input type="date" {...register("due_date",{required:true})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-sm text-foreground">Ítems</h4>
                <button type="button" onClick={()=>append(defaultItem)} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
                  <Plus size={15}/> Agregar ítem
                </button>
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/5 border-b border-border text-muted-foreground text-xs">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Descripción</th>
                      <th className="px-3 py-2.5 text-right w-20">Cant.</th>
                      <th className="px-3 py-2.5 text-right w-32">Precio Unit.</th>
                      <th className="px-3 py-2.5 text-right w-20">Dto %</th>
                      <th className="px-3 py-2.5 text-left w-36">Impuesto</th>
                      <th className="px-3 py-2.5 text-right w-32">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, idx) => {
                      const qty = Number(watchedItems[idx]?.quantity)||0;
                      const price = Number(watchedItems[idx]?.unit_price)||0;
                      const dto = Number(watchedItems[idx]?.discount_pct)||0;
                      const taxRate = watchedItems[idx]?.tax_id ? TAX_RATES[watchedItems[idx].tax_id]||0 : 0;
                      const lineTotal = qty * price * (1 - dto/100) * (1 + taxRate/100);
                      return (
                        <tr key={field.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2"><input {...register(`items.${idx}.description`,{required:true})} placeholder="Ej. Desarrollo App" className="w-full bg-transparent focus:outline-none text-foreground"/></td>
                          <td className="px-3 py-2"><input type="number" min="0.01" step="0.01" {...register(`items.${idx}.quantity`)} className="w-full bg-transparent focus:outline-none text-right text-foreground"/></td>
                          <td className="px-3 py-2"><input type="number" min="0" step="100" {...register(`items.${idx}.unit_price`)} className="w-full bg-transparent focus:outline-none text-right text-foreground"/></td>
                          <td className="px-3 py-2"><input type="number" min="0" max="100" {...register(`items.${idx}.discount_pct`)} className="w-full bg-transparent focus:outline-none text-right text-foreground"/></td>
                          <td className="px-3 py-2">
                            <select {...register(`items.${idx}.tax_id`)} className="w-full bg-transparent focus:outline-none text-sm text-foreground">
                              {TAX_OPTIONS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-foreground">{fmt(lineTotal)}</td>
                          <td className="px-3 py-2">{fields.length>1&&<button type="button" onClick={()=>remove(idx)} className="text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 size={14}/></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-sm text-muted-foreground items-center">
                  <span>Descuento global (%)</span>
                  <input type="number" min="0" max="100" {...register("discount")} className="w-20 bg-background border border-border rounded px-2 py-0.5 text-sm text-right focus:outline-none"/>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>IVA</span><span>{fmt(taxTotal)}</span></div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea {...register("notes")} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Términos y condiciones</label>
                <textarea {...register("terms")} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"/>
              </div>
            </div>
          </div>

          {/* Inline error */}
          {saveError && (
            <div className="mx-6 mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5"/><span>{saveError}</span>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
            <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors text-foreground">Cancelar</button>
            <button type="submit" disabled={isSubmitting||(submittedRef.current&&!saveError)}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70">
              {isSubmitting&&<Loader2 size={16} className="animate-spin"/>} Guardar Factura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
