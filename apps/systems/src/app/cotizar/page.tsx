"use client";

import React from "react";
import { motion } from "framer-motion";
import { Copy, MapPin, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createManualLead } from "@/app/admin/leads/actions";
import { TextReveal } from "@/components/motion/TextReveal";
import { Reveal, RevealGroup, RevealItem, EASE } from "@/components/motion/Reveal";
import { SERVICES, PROCESS_STEPS, CONTACT } from "@/content/services";

export default function CotizarPage() {
  const [copiedData, setCopiedData] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [servicio, setServicio] = React.useState("");

  // Los paquetes y las tarjetas de servicio enlazan con ?servicio=<slug>
  React.useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("servicio");
    if (slug && SERVICES.some((s) => s.slug === slug)) setServicio(slug);
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(CONTACT.email);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const slug = fd.get("projectType") as string;
    const service = SERVICES.find((s) => s.slug === slug);

    const data = {
      fullName: fd.get("fullName"),
      company: fd.get("company"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      projectType: service ? service.shortTitle : "Aún no lo sé",
      budget: fd.get("budget"),
      requirement: fd.get("requirement"),
      source: "Web",
      stage: "Nuevo Prospecto",
    };

    try {
      await createManualLead(data);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al enviar el formulario. Por favor escríbanos directamente al correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 bg-muted text-secondary">
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-8">

            {/* Left Context */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <p className="eyebrow tracking-[0.25em] mb-5">Contacto</p>
                <TextReveal
                  as="h1"
                  className="display-2 mb-4"
                  segments={[{ text: "Empecemos por una" }, { text: "conversación.", highlight: true }]}
                />
                <p className="lead text-secondary/70">
                  Cuéntenos qué tarea le está consumiendo más tiempo, qué cliente se le está
                  escapando o qué requisito cumple con angustia cada mes. Le decimos con franqueza
                  si tiene solución, cuál sería y en cuánto tiempo se vería el resultado. Sin costo
                  y sin compromiso.
                </p>
              </motion.div>

              {/* Qué pasa después */}
              <Reveal className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
                <h2 className="text-xs uppercase font-bold tracking-widest text-secondary/50">
                  Qué pasa después
                </h2>
                {PROCESS_STEPS.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <span className="text-lg font-black text-primary/30 tracking-tighter shrink-0">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm leading-tight mb-1">{step.title}</h3>
                      <p className="text-xs text-secondary/60 font-light leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </Reveal>

              <RevealGroup className="space-y-6" stagger={0.08}>
                <RevealItem className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Mail size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Escríbanos directamente</p>
                      <p className="font-semibold text-lg">{CONTACT.email}</p>
                   </div>
                   <button onClick={copyEmail} className="text-secondary/50 hover:text-primary transition-colors p-2" aria-label="Copiar correo">
                       {copiedData ? <span className="text-xs text-primary font-bold">Copiado</span> : <Copy size={20} />}
                   </button>
                </RevealItem>

                <RevealItem className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Phone size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Llámenos o escríbanos por WhatsApp</p>
                      <p className="font-semibold text-lg">{CONTACT.phone}</p>
                   </div>
                </RevealItem>

                <RevealItem className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300">
                   <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <MapPin size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-secondary/50 mb-1">Dónde estamos</p>
                      <p className="font-semibold text-sm">Cartagena, Sincelejo y Barranquilla · Proyectos en toda Latinoamérica</p>
                   </div>
                </RevealItem>
              </RevealGroup>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-border shadow-xl rounded-3xl card-pad md:p-12 relative overflow-hidden lg:sticky lg:top-28"
              >
                {success ? (
                  <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="display-3 mb-4">Recibimos su mensaje.</h2>
                    <p className="text-secondary/70 font-light mb-8 max-w-sm leading-relaxed">
                      Nos comunicamos con usted en las próximas horas hábiles para agendar la
                      conversación de 30 minutos. Si prefiere adelantarla, escríbanos a{" "}
                      <span className="font-semibold text-secondary">{CONTACT.email}</span>.
                    </p>
                    <Button variant="outline" onClick={() => setSuccess(false)}>Enviar otra solicitud</Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-2 relative z-10">Cuéntenos su caso</h2>
                    <p className="text-sm text-secondary/60 font-light mb-8 relative z-10">
                      Toma menos de dos minutos. No necesita tener claro el detalle técnico: para
                      eso estamos nosotros.
                    </p>
                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="fullName" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Nombre completo</label>
                          <input id="fullName" name="fullName" type="text" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Ej. Juan Pérez" required/>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="company" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Empresa u oficina</label>
                          <input id="company" name="company" type="text" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Ej. Pérez & Asociados"/>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Correo</label>
                          <input id="email" name="email" type="email" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="juan@suempresa.com" required/>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Teléfono o WhatsApp</label>
                          <input id="phone" name="phone" type="tel" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="+57 300 000 0000"/>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="projectType" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">¿Con qué se relaciona su necesidad?</label>
                        <select
                          id="projectType"
                          name="projectType"
                          value={servicio}
                          onChange={(e) => setServicio(e.target.value)}
                          className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-secondary"
                        >
                          <option value="">Aún no lo sé — ayúdenme a identificarlo</option>
                          {SERVICES.map((s) => (
                            <option key={s.slug} value={s.slug}>
                              {s.number} · {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="budget" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">Inversión que tiene considerada</label>
                        <select id="budget" name="budget" defaultValue="" className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all text-secondary" required>
                          <option value="" disabled>Seleccione un rango aproximado</option>
                          <option value="1k-5k">$1,000 - $5,000 USD</option>
                          <option value="5k-15k">$5,000 - $15,000 USD</option>
                          <option value="15k-50k">$15,000 - $50,000 USD</option>
                          <option value="50k+">Más de $50,000 USD</option>
                          <option value="por-definir">Todavía no lo tengo definido</option>
                        </select>
                        <p className="text-xs text-secondary/50 font-light">
                          Nos sirve para proponerle un alcance realista. No compromete nada.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="requirement" className="text-sm font-semibold uppercase tracking-wider text-secondary/80">¿Qué le está costando tiempo o dinero hoy?</label>
                        <textarea id="requirement" name="requirement" rows={5} className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none" placeholder="Ej. Cada mes dedicamos tres días a armar el mismo informe con datos de dos programas distintos, y aun así se nos pasan errores." required></textarea>
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={loading} variant="default" size="lg" className="w-full h-14 text-base tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                            {loading ? "Enviando..." : "Solicitar la conversación"}
                        </Button>
                        <p className="text-center text-xs text-secondary/50 font-light mt-4">
                          Sus datos llegan directamente a nuestro equipo comercial. No los
                          compartimos con terceros ni los usamos para publicidad.
                        </p>
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
