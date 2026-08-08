import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  document_type: z.string().optional(),
  document_number: z.string().optional(),
  email: z.string().email("Correo inválido").or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_regime: z.string().optional(),
  category: z.string().optional(),
  bank_account: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "clientes" | "proveedores";
  initialData?: any; // For editing
}

export function ThirdPartyModal({ isOpen, onClose, onSuccess, type, initialData }: Props) {
  const isEditing = !!initialData;
  const isSupplier = type === "proveedores";
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", document_type: "", document_number: "", email: "", phone: "", 
      address: "", tax_regime: "", category: "", bank_account: "", notes: ""
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ name: "", document_type: "", document_number: "", email: "", phone: "", address: "", tax_regime: "", category: "", bank_account: "", notes: "" });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    const endpoint = isSupplier ? '/api/accounting/suppliers' : '/api/accounting/clients';
    const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al guardar el registro.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h3 className="text-xl font-bold text-foreground">
            {isEditing ? "Editar" : "Nuevo"} {isSupplier ? "Proveedor" : "Cliente"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="third-party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Nombre / Razón Social *</label>
                <input 
                  {...register("name")} 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="Ej. Acme Corp" 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tipo de Documento</label>
                <select {...register("document_type")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                  <option value="">Seleccionar...</option>
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="RUT">RUT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Número de Documento</label>
                <input {...register("document_number")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Correo Electrónico</label>
                <input {...register("email")} type="email" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
                <input {...register("phone")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Dirección Física</label>
                <input {...register("address")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              {/* Conditional Fields based on Type */}
              {!isSupplier ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Régimen Tributario</label>
                  <select {...register("tax_regime")} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                    <option value="">Seleccionar...</option>
                    <option value="Responsable de IVA">Responsable de IVA</option>
                    <option value="No Responsable de IVA">No Responsable de IVA</option>
                    <option value="Régimen Simple">Régimen Simple de Tributación</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Categoría</label>
                    <input {...register("category")} placeholder="Tecnología, Insumos, etc." className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Cuenta Bancaria</label>
                    <input {...register("bank_account")} placeholder="Banco y Número de cuenta" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Notas Internas</label>
                <textarea {...register("notes")} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border shrink-0 flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-colors text-foreground">
            Cancelar
          </button>
          <button 
            type="submit" 
            form="third-party-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
