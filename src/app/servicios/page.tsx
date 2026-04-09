"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BrainCircuit, Database, Braces, Smartphone, ShieldCheck, Cog, Cloud, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SERVICES_DETAILED = [
  {
    icon: <Braces size={40} />,
    title: "Desarrollo de Software Custom",
    desc: "Creamos ecosistemas digitales de alto nivel, funcionales y robustos a tu propia escala operativa.",
    features: ["Aplicaciones Web complejas y SAAS", "Dashboards administrativos (B2B)", "Arquitecturas escalables (Clean Code)"]
  },
  {
    icon: <BrainCircuit size={40} />,
    title: "IA & Agentes Cognitivos",
    desc: "Integramos modelos fundacionales (OpenAI, Anthropic) directamente a la base de conocimiento de tu empresa.",
    features: ["RAG (Recuperación Aumentada por Generación)", "Bots asistentes que analizan documentos nativos", "Clasificación de data automatizada"]
  },
  {
    icon: <Smartphone size={40} />,
    title: "Automatización Comercial",
    desc: "Flujos desatendidos 24/7 en plataformas como WhatsApp e Instagram, respondiendo como el mejor vendedor.",
    features: ["Agentes de venta y soporte autónomos", "Integración con CRM (HubSpot, Salesforce)", "Agendamiento de citas sin humanos"]
  },
  {
    icon: <Database size={40} />,
    title: "Ingeniería de Datos y Cloud",
    desc: "Aseguramos la infraestructura y la accesibilidad veloz de tu big data empresarial en los principales proveedores en la nube.",
    features: ["Migraciones AWS, Azure, Vercel", "Optimización de consultas PostgreSQL/NoSQL", "Contenedores y Serverless (Docker, Kubernetes)"]
  },
  {
    icon: <Cog size={40} />,
    title: "Hardware, IoT e Integraciones",
    desc: "Traspasamos la frontera de lo digital y obtenemos datos del mundo real a través de micro-controladores y electrónica custom.",
    features: ["Sensores de recolección remota (Telemetría)", "Integraciones por RS485 / Modbus", "Prototipado PCB y Firmware"]
  },
  {
    icon: <ShieldCheck size={40} />,
    title: "Consultoría Tecnológica & Auditoría",
    desc: "Analizamos tu stack actual, evaluamos vulnerabilidades e indexamos un mapa de ruta hacia modernización.",
    features: ["Análisis de Código Estático", "Reestructuración y Refactorización (Tech Debt)", "Compliance B2B Digital"]
  }
];

export default function ServiciosPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-white text-secondary">
      {/* Header */}
      <section className="bg-secondary text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute top-0 w-full h-full bg-gradient-to-b from-primary/20 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">
            Ecosistema de <span className="text-primary">Servicios Tecnológicos.</span>
          </h1>
          <p className="text-xl text-white/80 font-light leading-relaxed">
            Metodologías ágiles (Scrum), desarrollo Cloud First y adopción de Inteligencia Artificial como pilar central, permitiendo escalar tu ventaja competitiva.
          </p>
        </div>
      </section>

      {/* Services Grid Detailed */}
      <section className="py-24 relative">
         <div className="absolute left-0 top-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2"></div>
         <div className="absolute right-0 bottom-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES_DETAILED.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-muted border border-border/50 p-8 rounded-[2rem] hover:shadow-2xl hover:border-primary/30 transition-all duration-300 flex flex-col group h-full relative overflow-hidden"
              >
                  <div className="absolute -right-4 -top-4 opacity-5 text-secondary transition-transform group-hover:scale-150 duration-700">
                     {React.cloneElement(svc.icon as React.ReactElement<any>, { size: 120 })}
                  </div>
                <div className="w-16 h-16 bg-white border border-border/50 text-primary flex items-center justify-center rounded-2xl mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors relative z-10">
                  {svc.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors relative z-10">{svc.title}</h3>
                <p className="text-secondary/70 font-light leading-relaxed mb-8 flex-1 relative z-10">
                  {svc.desc}
                </p>
                
                <div className="bg-white rounded-xl p-5 border border-border/50 relative z-10">
                   <h4 className="text-xs uppercase font-bold text-secondary/50 tracking-widest mb-3">Alcance Principal</h4>
                   <ul className="space-y-3">
                      {svc.features.map((feature, idx) => (
                         <li key={idx} className="flex gap-2 text-sm text-secondary/80">
                            <Cloud size={16} className="text-primary mt-0.5 shrink-0"/>
                            <span className="font-medium">{feature}</span>
                         </li>
                      ))}
                   </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-black mb-6">¿Tu requerimiento no está en la lista?</h2>
          <p className="text-xl font-light mb-10 opacity-90 max-w-2xl mx-auto">
            Somos ingenieros de principio a fin. Si puedes imaginar el flujo de trabajo lógico, nosotros podemos codificarlo e impulsarlo.
          </p>
          <Link href="/cotizar">
            <Button variant="accent" size="lg" className="rounded-full h-14 px-10">Agendar Consultoría Técnica</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
