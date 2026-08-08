import * as React from "react";
import Image from "next/image";
import { CheckCircle2, Award, Zap, Building2, Link as LucideLink, HeartHandshake } from "lucide-react";

export const metadata = {
  title: "Nosotros | Voltac Energy",
  description: "Conoce el propósito de Voltac Energy y nuestro equipo técnico pionero en transición energética.",
};

export default function NosotrosPage() {
  return (
    <div className="pt-24 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Hero Section Nosotros */}
        <section className="flex flex-col lg:flex-row gap-16 lg:items-center mb-32">
          <div className="lg:w-1/2 space-y-8">
            <h1 className="text-5xl md:text-6xl font-black text-secondary tracking-tight leading-tight">
              Ingenieros de tu <br className="hidden md:block" />
              <span className="text-primary italic font-serif opacity-80 decoration-accent underline decoration-4 underline-offset-8">futuro energético.</span>
            </h1>
            <p className="text-xl text-secondary/70 font-light leading-relaxed">
              Voltac Energy nace como la línea de negocio especializada en impacto ambiental y eficiencia energética del grupo Voltac Systems. Desarrollamos plantas solares que cumplen con estándares mundiales de seguridad mientras impulsamos el desarrollo local en Colombia.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
               <div>
                 <span className="block text-4xl font-black text-primary tabular-nums">100%</span>
                 <span className="text-sm font-semibold uppercase tracking-wider text-secondary/60">Capital Colombiano</span>
               </div>
               <div>
                 <span className="block text-4xl font-black text-primary tabular-nums">3+</span>
                 <span className="text-sm font-semibold uppercase tracking-wider text-secondary/60">Años de Ingeniería</span>
               </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl group border border-border">
            <Image
              src="/certifying_us.png"
              fill
              alt="Equipo Voltac Energy"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Float badge */}
            <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-border/50">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                <Award size={24} />
              </div>
              <div>
                <p className="font-bold text-secondary uppercase text-sm tracking-widest">Certificación</p>
                <p className="text-secondary/60 font-medium">RETIE - RETILAP</p>
              </div>
            </div>
          </div>
        </section>

        {/* Misión y Visión */}
        <section className="grid lg:grid-cols-2 gap-8 mb-32">
          <div className="bg-secondary p-12 rounded-[2rem] text-white space-y-6 relative overflow-hidden group">
             <div className="absolute -right-8 -top-8 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
             <Zap className="text-accent mb-6" size={40} />
             <h2 className="text-3xl font-black tracking-tight">Nuestra Misión</h2>
             <p className="text-lg font-light leading-relaxed text-white/80">
               Diseñar, implementar y operar soluciones fotovoltaicas seguras y rentables a nivel residencial, comercial, industrial y de generación, reduciendo costos energéticos y emisiones de carbono y garantizando calidad técnica.
             </p>
          </div>
          <div className="bg-muted p-12 rounded-[2rem] text-secondary space-y-6 relative overflow-hidden group border border-border">
             <div className="absolute -left-8 -bottom-8 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
             <Building2 className="text-primary mb-6" size={40} />
             <h2 className="text-3xl font-black tracking-tight">Nuestra Visión</h2>
             <p className="text-lg font-light leading-relaxed text-secondary/80">
               Ser la unidad referente en Colombia para el desarrollo integral de proyectos solares On-Grid, Off-Grid y granjas solares. Reconocida por excelencia en ingeniería, ejecución impecable y altos estándares de seguridad.
             </p>
          </div>
        </section>

        {/* Diferenciadores */}
        <section className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-secondary">Nuestro ADN Técnico</h2>
            <p className="text-secondary/60 font-light text-lg">Por qué empresas y hogares confían su independencia energética en nosotros.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: <CheckCircle2 size={24}/>, title: "Seguridad Ante Todo", desc: "Superamos las normativas locales garantizando protección eléctrica y estructural." },
              { icon: <HeartHandshake size={24}/>, title: "Acompañamiento Total", desc: "No te abandonamos tras encender el sistema; monitoreamos y mantenemos tu planta." },
              { icon: <Award size={24}/>, title: "Ingeniería Premium", desc: "Equipos de élite: Paneles Tier 1 (A-Grade) e inversores con IA incorporada." },
              { icon: <LucideLink size={24}/>, title: "Gestión Operador Red", desc: "Nos encargamos 100% de la tramitología ante el operador local (Afinia, Air-e, EPM, etc)." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white border border-border rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 text-primary">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-secondary mb-2">{item.title}</h4>
                  <p className="text-secondary/60 text-sm font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
