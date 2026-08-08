"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileUp, Calculator, Building2, CheckCircle2, ChevronRight, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const expressSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().min(10, "El celular no es válido"),
  email: z.string().email("Correo electrónico inválido"),
  file: z.any().optional(), // Real file validation needs more logic
  terms: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
});

const manualSchema = z.object({
  fullName: z.string().min(3, "Requerido"),
  phone: z.string().min(10, "Requerido"),
  consumption: z.number().min(1, "Debe ser mayor a 0"),
  address: z.string().min(5, "Dirección requerida"),
  terms: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
});

const detailedSchema = z.object({
  fullName: z.string().min(3, "Requerido"),
  phone: z.string().min(10, "Requerido"),
  installType: z.string().min(1, "Selecciona una opción"),
  location: z.string().min(3, "Requerido"),
  objective: z.string().min(1, "Selecciona un objetivo"),
  gridType: z.string().min(1, "Selecciona tipo de red"),
  message: z.string().optional(),
  terms: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
});

export default function CotizarPage() {
  const [activeTab, setActiveTab] = React.useState<"express" | "manual" | "detailed">("express");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successModal, setSuccessModal] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const expressForm = useForm<z.infer<typeof expressSchema>>({
    resolver: zodResolver(expressSchema),
    defaultValues: { terms: false }
  });

  const manualForm = useForm<z.infer<typeof manualSchema>>({
    resolver: zodResolver(manualSchema),
    defaultValues: { terms: false }
  });

  const detailedForm = useForm<z.infer<typeof detailedSchema>>({
    resolver: zodResolver(detailedSchema),
    defaultValues: { terms: false }
  });

  const onSubmitExpress = async (data: z.infer<typeof expressSchema>) => {
    setIsSubmitting(true);
    fetch('/api/analytics', { method: 'POST', body: JSON.stringify({event: 'click_cotizar', path: '/cotizar/express'}) }).catch(()=>{});
    const formData = new FormData();
    formData.append("modality", "express");
    formData.append("fullName", data.fullName);
    formData.append("phone", data.phone);
    formData.append("email", data.email);
    
    // Usar el archivo controlado del estado en vez del input DOM
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      await fetch("/api/quote", { method: "POST", body: formData });
      expressForm.reset();
      setSelectedFile(null);
      setSuccessModal(true);
    } catch(e) { console.error(e); }
    setIsSubmitting(false);
  };

  const onSubmitManual = async (data: z.infer<typeof manualSchema>) => {
    setIsSubmitting(true);
    fetch('/api/analytics', { method: 'POST', body: JSON.stringify({event: 'click_cotizar', path: '/cotizar/manual'}) }).catch(()=>{});
    const formData = new FormData();
    formData.append("modality", "manual");
    formData.append("fullName", data.fullName);
    formData.append("phone", data.phone);
    formData.append("consumption", String(data.consumption));
    formData.append("address", data.address);

    try {
      await fetch("/api/quote", { method: "POST", body: formData });
      manualForm.reset();
      setSuccessModal(true);
    } catch(e) { console.error(e); }
    setIsSubmitting(false);
  };

  const onSubmitDetailed = async (data: z.infer<typeof detailedSchema>) => {
    setIsSubmitting(true);
    fetch('/api/analytics', { method: 'POST', body: JSON.stringify({event: 'click_cotizar', path: '/cotizar/detailed'}) }).catch(()=>{});
    const formData = new FormData();
    formData.append("modality", "detailed");
    formData.append("fullName", data.fullName);
    formData.append("phone", data.phone);
    formData.append("installType", data.installType);
    formData.append("location", data.location);
    formData.append("objective", data.objective);
    formData.append("gridType", data.gridType);
    if (data.message) formData.append("message", data.message);

    try {
      await fetch("/api/quote", { method: "POST", body: formData });
      detailedForm.reset();
      setSuccessModal(true);
    } catch(e) { console.error(e); }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted pt-24 pb-24">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">Diseña tu Sistema Hoy</h1>
          <p className="text-secondary/70 max-w-2xl mx-auto font-light">Selecciona la modalidad que más te acomode para recibir tu cotización inteligente.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          
          {/* Tabs Nav */}
          <div className="flex flex-col md:flex-row border-b border-border bg-muted/30">
            <button
              onClick={() => setActiveTab("express")}
              className={cn("flex-1 px-6 py-6 text-left border-b-2 hover:bg-white transition-colors relative", activeTab === "express" ? "border-primary bg-white text-primary" : "border-transparent text-secondary/60")}
            >
              <FileUp className="mb-2" size={24} />
              <div className="font-bold uppercase tracking-widest text-sm mb-1">Modalidad 1</div>
              <div className="font-light text-xs">Sube tu factura (Express)</div>
              {activeTab === "express" && <div className="absolute top-0 right-4 h-full flex items-center"><CheckCircle2 size={16}/></div>}
            </button>
            <button
               onClick={() => setActiveTab("manual")}
               className={cn("flex-1 px-6 py-6 text-left border-b-2 hover:bg-white transition-colors relative md:border-l md:border-border", activeTab === "manual" ? "border-primary bg-white text-primary" : "border-transparent text-secondary/60")}
            >
              <Calculator className="mb-2" size={24} />
              <div className="font-bold uppercase tracking-widest text-sm mb-1">Modalidad 2</div>
              <div className="font-light text-xs">Ingresa tu consumo manual</div>
              {activeTab === "manual" && <div className="absolute top-0 right-4 h-full flex items-center"><CheckCircle2 size={16}/></div>}
            </button>
             <button
               onClick={() => setActiveTab("detailed")}
               className={cn("flex-1 px-6 py-6 text-left border-b-2 hover:bg-white transition-colors relative md:border-l md:border-border", activeTab === "detailed" ? "border-primary bg-white text-primary" : "border-transparent text-secondary/60")}
            >
              <Building2 className="mb-2" size={24} />
              <div className="font-bold uppercase tracking-widest text-sm mb-1">Modalidad 3</div>
              <div className="font-light text-xs">Proyectos comerciales (Detallada)</div>
              {activeTab === "detailed" && <div className="absolute top-0 right-4 h-full flex items-center"><CheckCircle2 size={16}/></div>}
            </button>
          </div>

          <div className="p-8 md:p-12">
            
            {/* TAB EXPRESS */}
            {activeTab === "express" && (
              <form onSubmit={expressForm.handleSubmit(onSubmitExpress)} className="space-y-6 max-w-2xl mx-auto">
                 <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-8 flex gap-3 text-sm text-secondary/80">
                   <div className="text-primary mt-0.5"><CheckCircle2 size={18}/></div>
                   La forma más rápida. Sube una foto o PDF de tu recibo de energía y nuestros ingenieros calcularán la mejor solución.
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Nombre Completo</label>
                     <input {...expressForm.register("fullName")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {expressForm.formState.errors.fullName && <p className="text-destructive text-xs mt-1">{expressForm.formState.errors.fullName.message}</p>}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Celular / WhatsApp</label>
                     <input {...expressForm.register("phone")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {expressForm.formState.errors.phone && <p className="text-destructive text-xs mt-1">{expressForm.formState.errors.phone.message}</p>}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-secondary">Correo Electrónico</label>
                   <input {...expressForm.register("email")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                   {expressForm.formState.errors.email && <p className="text-destructive text-xs mt-1">{expressForm.formState.errors.email.message}</p>}
                 </div>

                 <div className="space-y-2 pt-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">Sube tu factura (PDF, JPG, PNG)</label>
                    <div className="flex items-center justify-center w-full">
                       <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-colors">
                         <FileUp className="w-8 h-8 text-secondary/40 mb-2" />
                         <span className="text-sm font-medium text-secondary/60">Haz clic para buscar o arrastra el archivo aquí</span>
                         <span className="text-xs text-secondary/40 mt-1">Máximo 20MB · PDF, JPG, PNG</span>
                         <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setSelectedFile(f);
                         }} />
                       </label>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2 animate-in slide-in-from-top-2">
                         <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                           <File size={20} className="text-primary" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-secondary truncate">{selectedFile.name}</p>
                           <p className="text-xs text-secondary/50">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                         </div>
                         <button type="button" onClick={() => setSelectedFile(null)} className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors shrink-0">
                           <X size={14}/>
                         </button>
                      </div>
                    )}
                 </div>

                 <div className="pt-6">
                  <label className="flex items-start gap-4 cursor-pointer mb-6">
                    <input type="checkbox" {...expressForm.register("terms")} className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary/20 accent-primary" />
                    <span className="text-xs text-secondary/60 leading-relaxed font-light block">
                      Acepto la <a href="#" className="underline font-medium hover:text-primary">Política de Privacidad</a> (Ley 1581 de 2012) para el tratamiento de mis datos personales.
                    </span>
                  </label>
                  {expressForm.formState.errors.terms && <p className="text-destructive text-xs -mt-4 mb-4">{expressForm.formState.errors.terms.message}</p>}
                  
                  <Button type="submit" variant="default" size="lg" className="h-14 w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : <><>Cotizar Ahora <ChevronRight className="ml-2 w-5 h-5"/></></>}
                  </Button>
                 </div>
              </form>
            )}

            {/* TAB MANUAL */}
            {activeTab === "manual" && (
                <form onSubmit={manualForm.handleSubmit(onSubmitManual)} className="space-y-6 max-w-2xl mx-auto">
                 <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-8 flex gap-3 text-sm text-secondary/80">
                   <div className="text-primary mt-0.5"><Calculator size={18}/></div>
                   Si conoces tu consumo promedio (en kWh), ingrésalo aquí para dimensionar inmediatamente la capacidad que necesitas.
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Nombre Completo</label>
                     <input {...manualForm.register("fullName")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {manualForm.formState.errors.fullName && <p className="text-destructive text-xs mt-1">{manualForm.formState.errors.fullName.message}</p>}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Celular / WhatsApp</label>
                     <input {...manualForm.register("phone")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {manualForm.formState.errors.phone && <p className="text-destructive text-xs mt-1">{manualForm.formState.errors.phone.message}</p>}
                   </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Consumo Mensual (kWh)</label>
                     <input type="number" {...manualForm.register("consumption", { valueAsNumber: true })} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {manualForm.formState.errors.consumption && <p className="text-destructive text-xs mt-1">{manualForm.formState.errors.consumption.message}</p>}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Ciudad o Dirección</label>
                     <input {...manualForm.register("address")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                     {manualForm.formState.errors.address && <p className="text-destructive text-xs mt-1">{manualForm.formState.errors.address.message}</p>}
                   </div>
                 </div>

                 <div className="pt-6">
                  <label className="flex items-start gap-4 cursor-pointer mb-6">
                    <input type="checkbox" {...manualForm.register("terms")} className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary/20 accent-primary" />
                    <span className="text-xs text-secondary/60 leading-relaxed font-light block">
                      Acepto la <a href="#" className="underline font-medium hover:text-primary">Política de Privacidad</a> (Ley 1581 de 2012) para el tratamiento de mis datos personales.
                    </span>
                  </label>
                  {manualForm.formState.errors.terms && <p className="text-destructive text-xs -mt-4 mb-4">{manualForm.formState.errors.terms.message}</p>}
                  
                  <Button type="submit" variant="default" size="lg" className="h-14 w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : <><>Cotizar Ahora <ChevronRight className="ml-2 w-5 h-5"/></></>}
                  </Button>
                 </div>
                </form>
            )}

            {/* TAB DETAILED */}
            {activeTab === "detailed" && (
               <form onSubmit={detailedForm.handleSubmit(onSubmitDetailed)} className="space-y-6 max-w-2xl mx-auto">
                 <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-8 flex gap-3 text-sm text-secondary/80">
                   <div className="text-primary mt-0.5"><Building2 size={18}/></div>
                   Esta opción te permite enviar detalles exhaustivos sobre tu requerimiento, ideal para empresas industriales y proyectos en media tensión.
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Nombre Completo</label>
                     <input {...detailedForm.register("fullName")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Celular / WhatsApp</label>
                     <input {...detailedForm.register("phone")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                   </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Tipo de Instalación</label>
                     <select {...detailedForm.register("installType")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors">
                       <option value="">Selecciona una opción</option>
                       <option value="Residencial">Residencial</option>
                       <option value="Empresa">Empresa / Oficina</option>
                       <option value="Hotel">Hotel</option>
                       <option value="Tienda">Tienda / Local Comercial</option>
                       <option value="Industria">Industria / Gran Superficie</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Ciudad / Departamento</label>
                     <input {...detailedForm.register("location")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                   </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Objetivo Energético</label>
                     <select {...detailedForm.register("objective")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors">
                       <option value="">Selecciona tu objetivo</option>
                       <option value="Autoconsumo">Reducir tarifa (Autoconsumo)</option>
                       <option value="Inyeccion">Inyección a Red (Vender excedentes)</option>
                       <option value="Aislado">Aislado (Sin servicio de red)</option>
                       <option value="Hibrido">Híbrido (Respaldo con baterías)</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-secondary">Tipo de red eléctrica</label>
                     <select {...detailedForm.register("gridType")} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors">
                       <option value="">Selecciona una opción</option>
                       <option value="Monofasica">Monofásica (2 Hilos)</option>
                       <option value="Bifasica">Bifásica (3 Hilos)</option>
                       <option value="Trifasica">Trifásica</option>
                       <option value="No_se">No estoy seguro</option>
                     </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">Requerimientos / Mensaje Adicional</label>
                    <textarea {...detailedForm.register("message")} rows={3} className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none" placeholder="Especificaciones adicionales de techo, consumo nocturno, etc." />
                 </div>

                 <div className="pt-4">
                  <label className="flex items-start gap-4 cursor-pointer mb-6">
                    <input type="checkbox" {...detailedForm.register("terms")} className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary/20 accent-primary" />
                    <span className="text-xs text-secondary/60 leading-relaxed font-light block">
                      Acepto la <a href="#" className="underline font-medium hover:text-primary">Política de Privacidad</a> (Ley 1581 de 2012) para el tratamiento de mis datos personales.
                    </span>
                  </label>
                  {detailedForm.formState.errors.terms && <p className="text-destructive text-xs -mt-4 mb-4">{detailedForm.formState.errors.terms.message}</p>}
                  
                  <Button type="submit" variant="default" size="lg" className="h-14 w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Procesando..." : <><>Enviar Requerimiento <ChevronRight className="ml-2 w-5 h-5"/></></>}
                  </Button>
                 </div>
               </form>
            )}

          </div>
        </div>
      </div>

      {successModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary/90 backdrop-blur-md">
          <div className="bg-white p-10 md:p-14 rounded-[2rem] max-w-lg w-full text-center relative border border-border shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-secondary tracking-tight mb-4">¡Solicitud Exitosa!</h2>
            <p className="text-secondary/70 font-light text-lg mb-10 leading-relaxed">
              Hemos recibido tu información y la almacenamos de manera segura. Un ingeniero experto de <strong>Voltac Energy</strong> estará contactándote muy pronto para enviarte la propuesta.
            </p>
            <Button onClick={() => setSuccessModal(false)} variant="accent" size="lg" className="w-full h-14 font-bold text-secondary text-base hover:scale-105 transition-transform">
              Entendido, gracias
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
