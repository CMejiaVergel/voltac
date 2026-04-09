"use client";

import React from "react";
import { motion } from "framer-motion";
import { Copy, MapPin, Mail, Phone, Cpu, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createManualLead } from "@/app/admin/leads/actions";

export default function CotizarPage() {
  const [copiedData, setCopiedData] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText("dev@voltac.com.co");
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      fullName: fd.get("fullName"),
      company: fd.get("company"),
      email: fd.get("email"),
      budget: fd.get("budget"),
      requirement: fd.get("requirement"),
      source: "Web",
      stage: "Nuevo Prospecto"
    };

    try {
      await createManualLead(data);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al enviar el formulario. Por favor intenta al correo directamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 bg-muted text-secondary">
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-8">
            
            {/* Left Context */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Transforma <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tu visión</span> en software funcional.
                </h1>
                <p className="text-lg text-secondary/70 font-light leading-relaxed">
                  Completa este formulario y un ingeniero de soluciones te contactará para evaluar la arquitectura, plazos de entrega y presupuesto base de tu requerimiento tecnológico.
                </p>
              </motion.div>

              <div className="space-y-6 pt-8">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Mail size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Contacto Directo</p>
                      <p className="font-semibold text-lg">dev@voltac.com.co</p>
                   </div>
                   <button onClick={copyEmail} className="text-secondary/50 hover:text-primary transition-colors p-2">
                       {copiedData ? <span className="text-xs text-primary font-bold">Copiado</span> : <Copy size={20} />}
                   </button>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Phone size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Soporte y Ventas</p>
                      <p className="font-semibold text-lg">+57 313 625 3584</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <MapPin size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Sedes Físicas</p>
                      <p className="font-semibold text-sm">Cartagena, Sincelejo y Barranquilla</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-3">
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="bg-white border border-border shadow-xl rounded-3xl p-8 md:p-12 relative overflow-hidden"
              >
                 <div className="absolute -right-16 -top-16 opacity-5 z-0 pointer-events-none">
                    <Cpu size={250}/>
                 </div>
                
                {success ? (
                  <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-3xl font-black mb-4">¡Solicitud Enviada!</h3>
                    <p className="text-secondary/70 font-light mb-8 max-w-sm">
                      Hemos recibido tu información con éxito en el CRM. Un ingeniero de Voltac se comunicará contigo pronto.
                    </p>
                    <Button variant="outline" onClick={() => setSuccess(false)}>Enviar otro requerimiento</Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black mb-8 relative z-10">Cuéntanos sobre tu proyecto</h3>
                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Nombre Completo</label>
                          <input name="fullName" type="text" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all pb" placeholder="Ej. Juan Pérez" required/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Empresa (Opcional)</label>
                          <input name="company" type="text" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Ej. Mi Empresa S.A."/>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Correo Corporativo</label>
                          <input name="email" type="email" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="juan@miempresa.com" required/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Presupuesto Base (USD)</label>
                          <select name="budget" defaultValue="" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-secondary" required>
                            <option value="" disabled>Selecciona un rango estimado</option>
                            <option value="1k-5k">$1,000 - $5,000 USD</option>
                            <option value="5k-15k">$5,000 - $15,000 USD</option>
                            <option value="15k-50k">$15,000 - $50,000 USD</option>
                            <option value="50k+">Más de $50,000 USD</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Descripción del Requerimiento / Problema a Resolver</label>
                        <textarea name="requirement" rows={5} className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none" placeholder="Queremos un agente de IA que atienda WhatsApp y lea la base de datos de nuestro inventario..." required></textarea>
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full h-14 text-base tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                            {loading ? "Analizando y Enviando..." : "Enviar Solicitud"}
                        </Button>
                        <p className="text-center text-xs text-secondary/50 font-light mt-4">Al enviar este formulario los datos se enrutarán a nuestro panel CRM para agendamiento remoto seguro.</p>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
