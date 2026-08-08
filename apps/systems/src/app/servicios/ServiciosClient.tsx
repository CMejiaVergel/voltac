"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Clock, ArrowRight } from "lucide-react";
import { SERVICES, PACKAGES, GLOSSARY } from "@/content/services";
import { Reveal, RevealGroup, RevealItem, EASE } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import dynamic from "next/dynamic";

const ServiceVisual = dynamic(
  () => import("@/components/motion/service-visuals").then((m) => m.ServiceVisual),
  { ssr: false, loading: () => <div className="h-[162px] rounded-xl bg-white/40" /> },
);

export function ServiciosDetallados() {
  const reduced = useReducedMotion();

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
      {SERVICES.map((svc, i) => {
        const Icon = svc.icon;
        return (
          <motion.div
            key={svc.slug}
            initial={reduced ? undefined : { opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: (i % 2) * 0.1, ease: EASE }}
          >
            <SpotlightCard
              as="article"
              id={svc.slug}
              radius={340}
              className="scroll-mt-28 h-full bg-muted border border-border/50 card-pad md:p-10 rounded-[2rem] hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col group overflow-hidden"
            >
              {/* Miniatura animada: explica el servicio antes de leerlo */}
              <ServiceVisual slug={svc.slug} className="mb-6 relative z-10" />

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 bg-white border border-border/50 text-primary flex items-center justify-center rounded-2xl shadow-sm group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-500 shrink-0">
                  <Icon size={28} />
                </div>
                <span className="text-4xl font-black text-secondary/10 tracking-tighter transition-colors duration-500 group-hover:text-primary/20">
                  {svc.number}
                </span>
              </div>

              <h2 className="display-3 mb-4 group-hover:text-primary transition-colors duration-400 relative z-10">
                {svc.title}
              </h2>

              <p className="relative border-l-2 border-primary pl-4 text-secondary/80 italic font-light mb-6 z-10">
                “{svc.quote}”
              </p>

              <p className="text-secondary/70 font-light leading-relaxed mb-8 relative z-10">
                {svc.description}
              </p>

              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border/50 relative z-10 mt-auto">
                <h3 className="text-xs uppercase font-bold text-secondary/50 tracking-widest mb-4">
                  Así se ve en la práctica
                </h3>
                <RevealGroup as="ul" className="space-y-3" stagger={0.05} amount={0.1}>
                  {svc.practice.map((item, idx) => (
                    <RevealItem as="li" key={idx} className="flex gap-2 text-sm text-secondary/80">
                      <ChevronRight size={16} className="text-primary mt-0.5 shrink-0" />
                      <span className="font-medium leading-relaxed">{item}</span>
                    </RevealItem>
                  ))}
                </RevealGroup>

                <details className="group/details mt-6 pt-5 border-t border-border/50">
                  <summary className="cursor-pointer list-none text-xs uppercase font-bold tracking-widest text-secondary/40 hover:text-primary transition-colors flex items-center gap-2">
                    <ChevronRight
                      size={14}
                      className="transition-transform duration-300 group-open/details:rotate-90"
                    />
                    Detalle técnico
                  </summary>
                  <p className="text-sm text-secondary/60 font-light leading-relaxed mt-3">
                    {svc.technical}
                  </p>
                </details>
              </div>
            </SpotlightCard>
          </motion.div>
        );
      })}
    </div>
  );
}

export function PaquetesArranque() {
  return (
    <RevealGroup className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.09}>
      {PACKAGES.map((pkg) => (
        <RevealItem key={pkg.name} className="h-full">
          <SpotlightCard
            radius={220}
            intensity={0.16}
            className={`flex flex-col card-pad rounded-[2rem] bg-ink text-white border h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden ${
              pkg.featured ? "border-accent/50" : "border-white/10 hover:border-white/25"
            }`}
          >
            <div className="absolute inset-0 bg-grid opacity-20 mask-fade-y" aria-hidden />

            <div className="relative flex items-center justify-between gap-3 mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                <Clock size={14} />
                {pkg.duration}
              </div>
              {pkg.featured && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent soft-pulse" />
                  Arranca más rápido
                </span>
              )}
            </div>

            <h3 className="relative text-xl font-black mb-4 leading-tight">{pkg.name}</h3>

            <p className="relative font-light leading-relaxed text-sm flex-1 text-white/65">
              {pkg.description}
            </p>

            <Link
              href={`/cotizar?servicio=${pkg.relatedSlug}`}
              className="relative mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent hover:text-white transition-colors group/link"
            >
              Quiero empezar por aquí
              <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
            </Link>
          </SpotlightCard>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function Glosario() {
  return (
    <RevealGroup className="grid md:grid-cols-2 gap-x-12 gap-y-6" stagger={0.05}>
      {GLOSSARY.map((entry) => (
        <RevealItem key={entry.term}>
          <dl className="border-b border-border/60 pb-5 group">
            <dt className="font-bold text-secondary mb-1 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary transition-all duration-300 group-hover:w-4" />
              {entry.term}
            </dt>
            <dd className="text-secondary/60 font-light leading-relaxed text-sm pl-3">
              {entry.definition}
            </dd>
          </dl>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export { Reveal };
