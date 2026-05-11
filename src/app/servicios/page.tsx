import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServiciosGrid } from "./ServiciosClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios Tecnológicos",
  description: "Ecosistema de servicios de Voltac Systems: Desarrollo custom, IA, automatización y cloud computing.",
  keywords: ["servicios desarrollo", "software custom", "inteligencia artificial", "automatización", "cloud computing", "iot", "consultoría tecnológica"],
};

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
          <ServiciosGrid />
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
