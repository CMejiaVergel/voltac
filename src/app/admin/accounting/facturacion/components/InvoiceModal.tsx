"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Tax rate table (id -> percentage)
const TAX_RATES: Record<string, number> = { "1": 19, "2": 5, "3": 0 };
const TAX_OPTIONS = [
  { id: "", label: "Sin impuesto" },
  { id: "1", label: "IVA 19%" },
  { id: "2", label: "IVA 5%" },
  { id: "3", label: "Excluido 0%" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_id: string;
}

interface InvoiceFormData {
  type: "emitted" | "received";
  third_party_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  discount: number;
  notes: string;
  terms: string;
  items: InvoiceItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "emitted" | "received";
  initialData?: any;
}

export function InvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "emitted",
  initialData,
}: Props) {
  const isEditing = !!initialData;
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultItem: InvoiceItem = { description: "", quantity: 1, unit_price: 0, discount_pct: 0, tax_id: "" };

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      type: initialType,
      third_party_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: "",
      currency: "COP",
      discount: 0,
      notes: "",
      terms: "",
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedType = watch("type");
  const watchedDiscount = Number(watch("discount")) || 0;

  const thirdParties = watchedType === "emitted" ? clients : suppliers;

  // Calculate totals
  const subtotal = watchedItems.reduce((acc, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    return acc + base * (1 - (Number(item.discount_pct) || 0) / 100);
  }, 0);

  const taxTotal = watchedItems.reduce((acc, item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    const afterDiscount = base * (1 - (Number(item.discount_pct) || 0) / 100);
    const taxRate = item.tax_id ? TAX_RATES[item.tax_id] || 0 : 0;
    return acc + afterDiscount * (taxRate / 100);
  }, 0);

  const globalDiscount = subtotal * (watchedDiscount / 100);
  const total = subtotal + taxTotal - globalDiscount;

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch("/api/accounting/clients").then((r) => r.json()),
      fetch("/api/accounting/suppliers").then((r) => r.json()),
    ]).then(([cj, sj]) => {
      if (cj.success) setClients(cj.data.filter((x: any) => x.is_active));
      if (sj.success) setSuppliers(sj.data.filter((x: any) => x.is_active));
    });

    if (initialData) {
      reset(initialData);
    } else {
      reset({
        type: initialType,
        third_party_id: "",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: "",
        currency: "COP",
        discount: 0,
        notes: "",
        terms: "",
        items: [defaultItem],
      });
    }
  }, [isOpen, initialData, initialType, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      subtotal,
      tax_total: taxTotal,
      total,
      discount: Number(data.discount) || 0,
    };
    const endpoint = "/api/accounting/invoices";
    const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint;
    const method = isEditing ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al guardar la factura.");
      }
    } catch {
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">
            {isEditing ? "Editar" : "Nueva"} Factura{" "}
            {watchedType === "emitted" ? "Emitida" : "Recibida"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  {...register("type", { required: true })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                >
                  <option value="emitted">Emitida</option>
                  <option value="received">Recibida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {watchedType === "emitted" ? "Cliente" : "Proveedor"} *
                </label>
                <select
                  {...register("third_party_id", { required: "Selecciona un tercero" })}
                  className={cn(
                    "w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground",
                    errors.third_party_id ? "border-red-500" : "border-border"
                  )}
                >
                  <option value="">Seleccionar...</option>
                  {thirdParties.map((tp) => (
                    <option key={tp.id} value={String(tp.id)}>{tp.name}</option>
                  ))}
                </select>
                {errors.third_party_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.third_party_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Emisión *</label>
                <input type="date" {...register("issue_date", { required: true })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label>
                <input type="date" {...register("due_date", { required: true })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-sm text-foreground">Ítems</h4>
                <button
                  type="button"
                  onClick={() => append(defaultItem)}
                  className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                >
                  <Plus size={15} /> Agregar ítem
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
                    {fields.map((field, index) => {
                      const qty = Number(watchedItems[index]?.quantity) || 0;
                      const price = Number(watchedItems[index]?.unit_price) || 0;
                      const dto = Number(watchedItems[index]?.discount_pct) || 0;
                      const taxId = watchedItems[index]?.tax_id;
                      const taxRate = taxId ? TAX_RATES[taxId] || 0 : 0;
                      const base = qty * price * (1 - dto / 100);
                      const lineTotal = base * (1 + taxRate / 100);
                      return (
                        <tr key={field.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">
                            <input {...register(`items.${index}.description`, { required: true })} placeholder="Ej. Desarrollo App" className="w-full bg-transparent focus:outline-none text-foreground" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0.01" step="0.01" {...register(`items.${index}.quantity`)} className="w-full bg-transparent focus:outline-none text-right text-foreground" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="100" {...register(`items.${index}.unit_price`)} className="w-full bg-transparent focus:outline-none text-right text-foreground" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" max="100" {...register(`items.${index}.discount_pct`)} className="w-full bg-transparent focus:outline-none text-right text-foreground" />
                          </td>
                          <td className="px-3 py-2">
                            <select {...register(`items.${index}.tax_id`)} className="w-full bg-transparent focus:outline-none text-sm text-foreground">
                              {TAX_OPTIONS.map((t) => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-foreground">{fmt(lineTotal)}</td>
                          <td className="px-3 py-2">
                            {fields.length > 1 && (
                              <button type="button" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
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
                  <input type="number" min="0" max="100" {...register("discount")} className="w-20 bg-background border border-border rounded px-2 py-0.5 text-sm text-right focus:outline-none" />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>IVA</span><span>{fmt(taxTotal)}</span></div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                  <span>Total</span><span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notas al cliente</label>
                <textarea {...register("notes")} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Términos y condiciones</label>
                <textarea {...register("terms")} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
            <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Guardar Factura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
