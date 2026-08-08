import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiciosDetallados, PaquetesArranque, Glosario } from "./ServiciosClient";
import { TechGrid } from "@/components/motion/TechGrid";
import { TextReveal } from "@/components/motion/TextReveal";
import { Reveal } from "@/components/motion/Reveal";
import { ProcessTimeline } from "@/components/motion/ProcessTimeline";
import { SERVICES, CONTACT, FAQ } from "@/content/services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Servicios para que su organización deje de perder horas en trabajo manual: diagnóstico, automatización, atención automática de clientes 24 horas, programas a la medida, información para decidir, presencia digital y cumplimiento normativo.",
  keywords: [
    "automatización de tareas repetitivas",
    "asistente de whatsapp para empresas",
    "software a la medida colombia",
    "consultoría en inteligencia artificial",
    "tableros de control empresariales",
    "reportes a entidades de control",
    "digitalización de operaciones",
  ],
  alternates: { canonical: '/servicios' },
};

const serviceCatalogSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Portafolio de servicios Voltac Systems 2026",
  description:
    "Servicios de tecnología orientados a reducir trabajo manual, atender clientes de forma automática y cumplir requisitos normativos a tiempo.",
  itemListElement: SERVICES.map((svc, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: svc.title,
      description: svc.description,
      url: `${CONTACT.site}/servicios#${svc.slug}`,
      areaServed: ["Colombia", "Latinoamérica"],
      provider: { "@type": "Organization", name: "Voltac Systems" },
    },
  })),
};

/**
 * FAQPage: el formato que los buscadores generativos citan textualmente. Las
 * preguntas del marcado son exactamente las que se ven en la pagina; declarar
 * aqui contenido que no este visible es motivo de sancion.
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: CONTACT.site },
    { "@type": "ListItem", position: 2, name: "Servicios", item: CONTACT.site + "/servicios" },
  ],
};

export default function ServiciosPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-white text-secondary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceCatalogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <section
        data-techgrid-root
        className="bg-secondary text-white py-16 sm:py-20 md:py-24 relative overflow-hidden"
      >
        <TechGrid className="absolute inset-0 z-0 w-full h-full pointer-events-none mask-fade-radial opacity-60" />
        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-primary/20 to-transparent z-0" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-5 sm:mb-6">
              Lo que hacemos
            </p>
          </Reveal>
          <TextReveal
            as="h1"
            className="display-2 mb-6"
            segments={[{ text: "Servicios con" }, { text: "un mismo objetivo.", highlight: true }]}
          />
          <Reveal delay={0.2}>
            <p className="lead text-white/80">
              Cada servicio resuelve un problema concreto. Se contratan por separado o combinados,
              según lo que hoy más le esté costando. Si no sabe por dónde empezar, se empieza por el
              primero.
            </p>
          </Reveal>
        </div>

        <div className="beam absolute bottom-0 left-0 right-0" aria-hidden />
      </section>

      {/* Servicios en detalle */}
      <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2"></div>
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <ServiciosDetallados />
        </div>
      </section>

      {/* Paquetes de arranque */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10 md:mb-16">
            <Reveal>
              <p className="eyebrow mb-4">Formas de empezar</p>
            </Reveal>
            <TextReveal
              as="h2"
              className="display-2 mb-4"
              segments={[{ text: "Paquetes de" }, { text: "arranque.", highlight: true }]}
            />
            <Reveal delay={0.15}>
              <p className="lead text-secondary/70">
                Para quienes prefieren un punto de partida definido, con alcance y tiempo acotados.
              </p>
            </Reveal>
          </div>
          <PaquetesArranque />
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10 md:mb-16">
            <Reveal>
              <p className="eyebrow mb-4">Cómo trabajamos</p>
            </Reveal>
            <TextReveal
              as="h2"
              className="display-2"
              segments={[{ text: "De la conversación" }, { text: "al resultado.", highlight: true }]}
            />
          </div>

          <ProcessTimeline />
        </div>
      </section>

      {/* Glosario */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10 md:mb-16">
            <Reveal>
              <p className="eyebrow mb-4">Para hablar el mismo idioma</p>
            </Reveal>
            <TextReveal
              as="h2"
              className="display-2 mb-4"
              segments={[{ text: "Glosario" }, { text: "rápido.", highlight: true }]}
            />
            <Reveal delay={0.15}>
              <p className="lead text-secondary/70">
                Los términos que va a escuchar en cualquier conversación de tecnología, explicados
                como se los explicaríamos a un cliente.
              </p>
            </Reveal>
          </div>
          <Glosario />
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10 md:mb-16">
            <Reveal>
              <p className="eyebrow mb-4">Antes de escribirnos</p>
            </Reveal>
            <TextReveal
              as="h2"
              className="display-2 mb-4"
              segments={[{ text: "Preguntas" }, { text: "frecuentes.", highlight: true }]}
            />
          </div>

          <div className="max-w-3xl divide-y divide-border/60">
            {FAQ.map((item) => (
              <Reveal key={item.q}>
                <details className="group py-5">
                  <summary className="flex items-start gap-4 cursor-pointer list-none font-bold text-secondary hover:text-primary transition-colors">
                    <span className="text-primary mt-0.5 shrink-0 transition-transform duration-300 group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                    <h3 className="text-base sm:text-lg leading-snug">{item.q}</h3>
                  </summary>
                  <p className="text-secondary/70 font-light leading-relaxed mt-3 pl-8">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 sm:py-20 md:py-24 bg-secondary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 mask-fade-radial" aria-hidden />
        <div className="container mx-auto px-4 relative z-10">
          <TextReveal
            as="h2"
            className="display-2 mb-6"
            segments={[{ text: "¿Su caso no aparece" }, { text: "en la lista?", highlight: true }]}
          />
          <Reveal delay={0.15}>
            <p className="lead mb-10 opacity-90 max-w-2xl mx-auto">
              Cuéntenos qué tarea le está consumiendo más tiempo. Le decimos con franqueza si tiene
              solución, cuál sería y en cuánto tiempo se vería el resultado. Son 30 minutos, sin
              costo y sin compromiso.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <Link href="/cotizar">
              <Button variant="accent" size="lg" className="shine rounded-full h-12 px-8 text-sm">
                Agendar conversación
              </Button>
            </Link>
            <p className="mt-8 text-sm text-white/70 font-light">
              {CONTACT.email} · {CONTACT.phone}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
