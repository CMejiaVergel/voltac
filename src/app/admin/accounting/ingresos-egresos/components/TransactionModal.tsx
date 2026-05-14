"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  type: z.enum(["Ingreso", "Egreso"]),
  date: z.string().min(1, "Requerido"),
  amount: z.number({ coerce: true }).positive("Debe ser mayor a 0"),
  currency: z.string().default("COP"),
  description: z.string().min(2, "La descripción es obligatoria"),
  payment_method: z.string().optional(),
  status: z.string().default("Completado"),
  notes: z.string().optional(),
  category_id: z.number({ coerce: true }).optional().nullable(),
  account_id: z.number({ coerce: true }).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "Ingreso" | "Egreso";
  initialData?: any;
}

export function TransactionModal({ isOpen, onClose, onSuccess, initialType = "Ingreso", initialData }: Props) {
  const isEditing = !!initialData;
  const [accounts, setAccounts] = useState<any[]>([]);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialType, date: new Date().toISOString().split("T")[0],
      amount: 0, currency: "COP", description: "",
      payment_method: "Transferencia", status: "Completado", notes: "",
    }
  });

  const watchedType = watch("type");

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/accounting/accounts").then(r => r.json()).then(j => { if (j.success) setAccounts(j.data); });
    if (initialData) reset(initialData);
    else reset({ type: initialType, date: new Date().toISOString().split("T")[0], amount: 0, currency: "COP", description: "", payment_method: "Transferencia", status: "Completado", notes: "" });
  }, [isOpen, initialData, initialType, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    const endpoint = "/api/accounting/transactions";
    const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint;
    const method = isEditing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { onSuccess(); onClose(); }
      else alert("Error al guardar el movimiento.");
    } catch { alert("Error de conexión."); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            {watchedType === "Ingreso" ? <TrendingUp size={20} className="text-green-500" /> : <TrendingDown size={20} className="text-red-500" />}
            {isEditing ? "Editar" : "Nuevo"} Movimiento
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary/10 rounded-full"><X size={20} className="text-muted-foreground" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="tx-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-border">
              {(["Ingreso", "Egreso"] as const).map(t => (
                <label key={t} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold cursor-pointer transition-colors",
                  watchedType === t ? (t === "Ingreso" ? "bg-green-500 text-white" : "bg-red-500 text-white") : "text-muted-foreground hover:bg-secondary/5")}>
                  <input type="radio" {...register("type")} value={t} className="hidden" />
                  {t === "Ingreso" ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{t}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha *</label>
                <input type="date" {...register("date")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto *</label>
                <input type="number" step="0.01" min="0" {...register("amount")} className={cn("w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.amount ? "border-red-500" : "border-border")} />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción / Concepto *</label>
              <input {...register("description")} placeholder="Ej. Pago de proyecto X" className={cn("w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20", errors.description ? "border-red-500" : "border-border")} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago</label>
                <select {...register("payment_method")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                  <option>Transferencia</option>
                  <option>Efectivo</option>
                  <option>Tarjeta de Crédito</option>
                  <option>Tarjeta de Débito</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select {...register("status")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                  <option>Completado</option>
                  <option>Pendiente</option>
                  <option>Anulado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cuenta Contable</label>
              <select {...register("account_id")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                <option value="">Sin asignar</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas Internas</label>
              <textarea {...register("notes")} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border shrink-0 flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors text-foreground">Cancelar</button>
          <button type="submit" form="tx-form" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
