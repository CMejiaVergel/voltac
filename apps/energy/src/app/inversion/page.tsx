import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sun, FileCheck2, HandCoins } from "lucide-react";
import { InversionForm } from "./InversionForm";

export const metadata = {
  title: "Inversión Solar | Voltac Energy",
  description: "Aprovecha tu predio y genera rentabilidad con granjas solares. Voltac Energy conecta propietarios e inversionistas.",
};

export default function InversionPage() {
  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header Inversión */}
        <section className="text-center max-w-3xl mx-auto space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold text-sm tracking-widest uppercase">
            <TrendingUp size={16} /> Rentabilidad Sostenible
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary tracking-tight">
            Convierte tu Terreno en un <span className="text-primary italic">Activo Energético.</span>
          </h1>
          <p className="text-lg text-secondary/70 font-light max-w-2xl mx-auto">
            Desarrollamos granjas y mini-granjas solares. Si tienes un predio con las condiciones adecuadas, nos encargamos del estudio de factibilidad y articulación con inversionistas.
          </p>
        </section>

        {/* Modelo de negocio */}
        <section className="bg-secondary text-white rounded-[2.5rem] p-10 md:p-16 mb-24 relative overflow-hidden flex flex-col lg:flex-row gap-16 items-center border border-primary/20 shadow-2xl">
          <div className="lg:w-1/2 relative space-y-8 z-10">
            <div className="absolute -left-32 -top-32 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
            
            <h2 className="text-4xl font-black tracking-tighter text-white">¿Cómo funciona el modelo?</h2>
            
            <div className="space-y-6">
              {[
                 { icon: <Sun size={28}/>, text: "Identificamos predios con alto potencial de radiación e interconexión eléctrica." },
                 { icon: <FileCheck2 size={28}/>, text: "Realizamos los estudios técnicos, legales y de conexión al SIN (Sistema Interconectado)." },
                 { icon: <HandCoins size={28}/>, text: "Si el predio cumple los requisitos se paga alquiler entre 4 a 8 millones de pesos por hectárea" }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <div className="text-accent shrink-0 pt-1">{step.icon}</div>
                  <p className="font-light leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Requisitos Mínimos Card */}
          <div className="lg:w-1/2 w-full max-w-md bg-white text-secondary p-10 rounded-3xl shadow-xl relative z-10 transform lg:rotate-2 border border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <span className="text-2xl font-black">✓</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-6">Requisitos de Predio</h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 font-medium text-secondary/80">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                Área mínima de 2 Hectáreas planas
              </li>
              <li className="flex items-center gap-3 font-medium text-secondary/80">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                Distancia a red eléctrica &lt; 1 km
              </li>
              <li className="flex items-center gap-3 font-medium text-secondary/80">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                Saneamiento legal del lote
              </li>
              <li className="flex items-center gap-3 font-medium text-secondary/80">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                Vocación de suelo agroindustrial o industrial
              </li>
            </ul>
            
            <Link href="#form-inversion" className="block w-full">
              <Button variant="default" size="lg" className="w-full text-base font-bold shadow-lg shadow-primary/30">
                Evalúa tu predio
              </Button>
            </Link>
          </div>
        </section>

        {/* Inversión Contact Form - Simple mock integrated on page */}
        <section id="form-inversion" className="max-w-3xl mx-auto scroll-mt-32">
          <div className="bg-muted p-10 md:p-14 rounded-3xl border border-border text-center space-y-8">
             <div>
               <h2 className="text-3xl font-black text-secondary tracking-tight mb-4">¿Tienes un predio potencial?</h2>
               <p className="text-secondary/60 font-medium">Déjanos tus datos y un ingeniero experto en estructuración de granjas solares se pondrá en contacto.</p>
             </div>
             
             {/* Note: This normally hooks up to a DB or Zod form in future, simulated UI for PRD layout here */}
             <InversionForm />
          </div>
        </section>

      </div>
    </div>
  );
}
