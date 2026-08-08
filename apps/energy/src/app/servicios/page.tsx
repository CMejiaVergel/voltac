import * as React from "react";
import { ArrowRight, Activity, Zap, CheckCircle2, Battery, Cpu, BarChart3, Sun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SERVICES_DATA = [
  {
    category: "Diagnóstico Energético y Factibilidad",
    description: "Evaluación inicial, perfil de consumo (CRV), estimación de generación solar y factibilidad técnica-económica.",
    icon: <BarChart3 size={28} className="text-accent" />,
  },
  {
    category: "Ingeniería y Diseño",
    description: "Diagramas unifilares, dimensionamiento del sistema, layout y distribución de paneles, memorias de cálculo.",
    icon: <Cpu size={28} className="text-accent" />,
  },
  {
    category: "Suministro y Logística de Equipos",
    description: "Paneles Tier 1, inversores híbridos y on-grid de última generación directos de fábrica.",
    icon: <Sun size={28} className="text-accent" />,
  },
  {
    category: "Construcción e Instalación (IPC)",
    description: "Gerenciamiento de obras, gestión ante operadores de red para conexión bidireccional y RETIE.",
    icon: <Activity size={28} className="text-accent" />,
  },
  {
    category: "Comisionamiento y Puesta en Marcha",
    description: "Pruebas de parametrización rigurosas y verificación de producción antes de la entrega.",
    icon: <Zap size={28} className="text-accent" />,
  },
  {
    category: "Sistemas Híbridos y Almacenamiento",
    description: "Baterías de litio para respaldo y diseño de sistemas aislados (Off-Grid).",
    icon: <Battery size={28} className="text-accent" />,
  },
];

export const metadata = {
  title: "Servicios | Voltac Energy",
  description: "Catálogo completo de servicios fotovoltaicos de Voltac Energy. Desde factibilidad hasta ingeniería, construcción y operación.",
};

export default function ServiciosPage() {
  return (
    <div className="pt-24 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-3xl mb-16 space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm tracking-wider uppercase">
            Nuestras Soluciones
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-secondary tracking-tight">
            Catálogo Integral de <span className="text-primary">Servicios Solares.</span>
          </h1>
          <p className="text-xl text-secondary/70 font-light leading-relaxed">
            Desde la radiografía inicial de tu consumo hasta el mantenimiento de tu planta por 25 años. Abarcamos todo el ciclo de vida de tu proyecto fotovoltaico.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES_DATA.map((service, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-muted border border-border/50 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer flex flex-col h-full">
              <div className="w-14 h-14 rounded-xl bg-white border border-border/50 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">{service.category}</h3>
              <p className="text-secondary/60 font-light mb-6 flex-grow">
                {service.description}
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex gap-2 items-start text-sm text-secondary/80 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /> Acompañamiento especializado
                </li>
              </ul>
            </div>
          ))}
        </div>

        {/* Premium / Monitoreo Banner */}
        <section className="mt-24 p-10 md:p-16 bg-secondary text-white rounded-[2rem] relative overflow-hidden flex flex-col md:flex-row gap-12 items-center justify-between border border-primary/20">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full point-events-none" />
          
          <div className="max-w-2xl relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Monitoreo Inteligente IA & O&M</h2>
            <p className="text-white/70 font-light text-lg">
              Operación y mantenimiento preventivo con termografía, limpieza de paneles y una plataforma digital (App/Web) para visualizar generación, ahorro, CO2 evitado y saldo a favor en tiempo real.
            </p>
            <Link href="/cotizar">
              <Button variant="accent" size="lg" className="mt-4 border-none hover:scale-105">
                Solicitar O&M para mi proyecto
              </Button>
            </Link>
          </div>
          
          <div className="relative z-10 hidden lg:block border rounded-xl overflow-hidden shadow-2xl bg-white/5 border-white/10 p-6 flex-shrink-0">
             <Activity className="text-accent w-24 h-24 mb-4 opacity-80" />
             <div className="text-2xl font-black tabular-nums tracking-tighter">18.5 kWp</div>
             <div className="text-xs text-white/50 uppercase tracking-widest mt-1">Generación Actual</div>
          </div>
        </section>
        
      </div>
    </div>
  );
}
