"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Database, Braces, Smartphone, ShieldCheck, Cog, Cloud } from "lucide-react";

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

export function ServiciosGrid() {
  return (
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
  );
}
