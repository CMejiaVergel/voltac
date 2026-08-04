"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClientProyectos({ projects }: { projects: any[] }) {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-muted text-secondary">
      <section className="bg-white border-b border-border py-14 sm:py-16 md:py-20 text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="display-2 mb-6">
            Trabajos que <span className="text-primary">ya entregamos.</span>
          </h1>
          <p className="lead text-secondary/70">
            Organizaciones reales que hoy dedican menos horas a lo mismo. En cada caso encontrará
            qué les estaba costando tiempo, qué hicimos y qué cambió después.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 md:py-20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="space-y-16 md:space-y-24">
             {projects.length === 0 && (
               <div className="py-14 sm:py-16 md:py-20 text-center text-secondary/50 font-medium">Aún no hay proyectos públicos cargados en el portafolio.</div>
             )}
             {projects.map((proj, i) => {
                let parsedMetrics = [];
                try { 
                  let parsed = JSON.parse(proj.metrics || "[]"); 
                  if (Array.isArray(parsed)) parsedMetrics = parsed;
                } catch (e) {}

                return (
                 <motion.div 
                    key={proj.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className={`flex flex-col lg:flex-row gap-8 md:gap-16 items-center ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                 >
                    <div className="w-full lg:w-1/2 relative h-[260px] sm:h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-border/50">
                       <Image src={proj.imageUrl || '/Voltac_enviroment.png'} alt={proj.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent flex items-end p-8">
                          <div className="inline-block bg-primary/90 text-white backdrop-blur-sm text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                             {proj.techType}
                          </div>
                       </div>
                    </div>

                    <div className="w-full lg:w-1/2 space-y-6">
                       <h2 className="display-3 text-secondary">
                          {proj.title}
                       </h2>
                       
                       <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border/50 shadow-sm space-y-4">
                          <div>
                             <h4 className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Qué estaba costando tiempo</h4>
                             <p className="text-secondary/80 text-sm font-light leading-relaxed whitespace-pre-wrap">
                                {proj.challenge}
                             </p>
                          </div>
                          <div className="pt-4 border-t border-border">
                             <h4 className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Qué hicimos</h4>
                             <p className="text-secondary/80 text-sm font-light leading-relaxed whitespace-pre-wrap">
                                {proj.solution}
                             </p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          {parsedMetrics.map((metric: any, idx: number) => (
                             <div key={idx} className="bg-white border-l-4 border-primary p-4 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                   <p className="text-[10px] md:text-xs text-secondary/50 font-bold uppercase tracking-widest mb-1">{metric.label}</p>
                                   <p className="font-black text-xl md:text-2xl text-secondary">{metric.value}</p>
                                </div>
                                <div className="text-primary/30 p-2 bg-primary/5 rounded-full">
                                   <CheckCircle2 size={16}/>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </motion.div>
                );
             })}
          </div>
        </div>
      </section>

       <section className="py-14 sm:py-16 md:py-20 bg-secondary border-t border-primary/20 text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="display-2 mb-6 text-balance">¿Qué se podría resolver en su caso?</h2>
          <p className="text-white/70 font-light max-w-2xl mx-auto mb-8 leading-relaxed">
            Una conversación de 30 minutos basta para saberlo. Sin costo y sin compromiso.
          </p>
          <Link href="/cotizar">
             <Button variant="accent" size="lg" className="rounded-full shadow-lg hover:shadow-accent/30 h-12 px-8 text-sm shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                Agendar conversación <ArrowRight className="ml-2 w-4 h-4"/>
             </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
