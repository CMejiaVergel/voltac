"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Code, Brain, BotMessageSquare, Cpu, Rocket, ShieldCheck, Zap, Activity } from "lucide-react";
import { SiReact, SiNextdotjs, SiPython, SiFastapi, SiNodedotjs, SiDocker, SiOpenai, SiPostgresql, SiArduino, SiCplusplus } from "react-icons/si";
import { Button } from "@/components/ui/button";

const SERVICES = [
  { title: "Desarrollo a Medida & Web", desc: "Plataformas web, dashboards B2B y aplicaciones diseñadas bajo metodologías ágiles.", icon: <Code size={32} /> },
  { title: "IA & Agentes Cognitivos", desc: "Sistemas RAG para lectura documental, predicción de datos y análisis corporativo.", icon: <Brain size={32} /> },
  { title: "Automatización WhatsApp / IG", desc: "Agentes que venden y atienden clientes 24/7 conectados a tu CRM interno.", icon: <BotMessageSquare size={32} /> },
  { title: "Desarrollo Hardware & IoT", desc: "Diseño PCB, sensores conectados y telemetría para optimizar tu cadena productiva.", icon: <Cpu size={32} /> },
];

const METRICS = [
  { label: "Tiempos Reducidos", value: "85", suffix: "%" },
  { label: "Usuarios SOPORTADOS", value: "100", suffix: "k+" },
  { label: "Automatización", value: "300", prefix: "+", suffix: "%" },
  { label: "Stack Tech", value: "15", suffix: "+" },
];

import { FaAws } from "react-icons/fa";

const TECH_ITEMS = [
  { name: "React", icon: <SiReact size={32} /> },
  { name: "Next.js", icon: <SiNextdotjs size={32} /> },
  { name: "Python", icon: <SiPython size={32} /> },
  { name: "FastAPI", icon: <SiFastapi size={32} /> },
  { name: "Node.js", icon: <SiNodedotjs size={32} /> },
  { name: "AWS", icon: <FaAws size={32} /> },
  { name: "Docker", icon: <SiDocker size={32} /> },
  { name: "OpenAI / LLMs", icon: <SiOpenai size={32} /> },
  { name: "PostgreSQL", icon: <SiPostgresql size={32} /> },
  { name: "Arduino", icon: <SiArduino size={32} /> },
  { name: "C++", icon: <SiCplusplus size={32} /> },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative h-screen min-h-[650px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/Voltac_enviroment.png"
            alt="Inteligencia Artificial y Software - Voltac Systems"
            fill
            className="object-cover object-center scale-105"
            priority
          />
          <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/60 to-secondary" />
        </div>

        <div className="container mx-auto px-6 md:px-12 lg:px-32 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl space-y-8 text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-md text-accent text-sm font-semibold tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Rocket size={16} className="text-accent animate-pulse" />
              Impulsando la Transformación Digital
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05]">
              Aceleramos tu negocio con <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary animate-pulse">Inteligencia Artificial</span> y Software a Medida.
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl leading-relaxed">
              Posicionamos a las empresas como referentes en la era digital mediante agentes cognitivos, automatización avanzada y arquitecturas cloud de primer nivel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/cotizar">
                <Button variant="accent" size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-[0_0_20px_rgba(96,165,250,0.3)]">
                  Consultar Proyecto <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/servicios">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base text-white border-white/30 hover:bg-white/10 hover:border-white">
                  Explorar Servicios
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Partners & Technologies Carousel */}
      <section className="py-10 bg-secondary/95 border-t border-primary/20 relative z-20 overflow-hidden">
         <div className="container mx-auto px-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Stack Tecnológico</p>
            <div 
               className="relative w-full overflow-hidden whitespace-nowrap"
               style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
            >
               <motion.div 
                 className="flex w-max"
                 animate={{ x: ["0%", "-50%"] }}
                 transition={{ ease: "linear", duration: 40, repeat: Infinity }}
               >
                 {[...TECH_ITEMS, ...TECH_ITEMS].map((tech, i) => (
                    <div key={i} className="flex items-center gap-4 px-12 text-white/60 hover:text-white transition-colors duration-300">
                       {tech.icon}
                       <span className="font-semibold text-lg md:text-xl tracking-wider uppercase">{tech.name}</span>
                    </div>
                 ))}
               </motion.div>
            </div>
         </div>
      </section>

      {/* 3. Featured Services */}
      <section className="py-24 bg-white text-secondary">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Ingeniería <span className="text-primary">Evolutiva.</span></h2>
              <p className="text-lg text-secondary/70 font-light">
                Solucionamos cuellos de botella empresariales con automatizaciones y desarrollos de software construidos por expertos, utilizando arquitecturas escalables.
              </p>
            </div>
            <Link href="/servicios" className="font-semibold text-primary hover:text-accent uppercase tracking-wider inline-flex items-center gap-2 group transition-colors">
              Ver ecosistema <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-muted border border-border/50 hover:bg-white hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                   {service.icon}
                </div>
                <div className="w-16 h-16 rounded-xl bg-white border border-border/50 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm group-hover:shadow-primary/30 group-hover:-translate-y-1">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-secondary">{service.title}</h3>
                <p className="text-secondary/60 font-light leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Voltac */}
      <section className="py-24 bg-secondary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[150px] rounded-full" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                ¿Por qué <span className="text-primary">Voltac?</span>
              </h2>
              <ul className="space-y-6">
                {[
                  { title: "Escalabilidad Cloud First", desc: "Desplegamos en AWS y Vercel asegurando que tu plataforma soporte 100 o 1 Millón de usuarios." },
                  { title: "Código Limpio y Mantenible", desc: "Desarrollamos con convenciones estrictas (SOLID, Clean Architecture) para facilitar futuras actualizaciones." },
                  { title: "Tiempos Ágiles (Scrum)", desc: "Entregables funcionales cada 2 semanas para que valides el ROI rápidamente." },
                  { title: "Innovación Activa", desc: "Integración directa con los modelos de lenguaje más recientes (GPT-4o, Claude 3)." },
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="mt-1 bg-primary/20 p-2 rounded-lg text-accent border border-primary/30">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1 text-white">{item.title}</h4>
                      <p className="text-white/60 font-light text-sm md:text-base leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="relative h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.15)] group">
              <Image src="/Voltac_enviroment.png" alt="Desarrollo Tecnológico" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Metrics & Impact */}
      <section className="py-24 bg-muted border-y border-border/50 relative overflow-hidden">
         <div className="absolute -left-32 -top-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-secondary tracking-tight mb-4">Métricas de <span className="text-primary">Impacto.</span></h2>
            <p className="text-secondary/60">Resultados cuantificables en los negocios de nuestros clientes tras implementar nuestras arquitecturas y automatizaciones AI.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {METRICS.map((metric, i) => (
               <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: i * 0.1 }}
               className="flex flex-col items-center justify-center text-center space-y-3 bg-white p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-all"
             >
               <div className="text-5xl font-black text-primary bg-clip-text">
                 <span className="text-3xl">{metric.prefix}</span>
                 {metric.value}
                 <span className="text-3xl">{metric.suffix}</span>
               </div>
               <div className="text-xs font-bold text-secondary/60 uppercase tracking-widest">{metric.label}</div>
             </motion.div>
            ))}
          </div>
          
          <div className="col-span-full mt-16 text-center">
             <Link href="/proyectos">
                <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white rounded-full font-bold uppercase tracking-wider h-14 px-10 text-sm gap-3 transition-colors shadow-sm">
                   Ver Casos de Éxito Detallados <Activity size={18}/>
                </Button>
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
