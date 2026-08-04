"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Activity, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnersMarquee } from "@/components/PartnersMarquee";
import { TechGrid } from "@/components/motion/TechGrid";
import { TextReveal } from "@/components/motion/TextReveal";
import { Reveal, RevealGroup, RevealItem, EASE } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ServiceVisual } from "@/components/motion/service-visuals";
import { SERVICES, PILLARS, SECTORS } from "@/content/services";

export default function Home() {
  const [primaryService, ...otherServices] = SERVICES;
  const PrimaryIcon = primaryService.icon;
  const reduced = useReducedMotion();

  // Paralaje del hero: el fondo se mueve más lento que el contenido y el texto
  // se desvanece al salir. Da profundidad sin distraer de la lectura.
  const heroRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero */}
      <section
        ref={heroRef}
        data-techgrid-root
        className="relative min-h-[88vh] flex items-center overflow-hidden py-28 sm:py-32"
      >
        <motion.div className="absolute inset-0 z-0" style={reduced ? undefined : { y: bgY }}>
          <Image
            src="/Voltac_enviroment.png"
            alt="Tecnología que le devuelve el tiempo a su equipo - Voltac Systems"
            fill
            className="object-cover object-center scale-110"
            priority
          />
          <div className="absolute inset-0 bg-secondary/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/70 to-secondary" />
        </motion.div>

        {/* Retícula técnica animada */}
        <TechGrid className="absolute inset-0 z-[1] w-full h-full pointer-events-none mask-fade-radial opacity-70" />

        {/* Halo que respira detrás del titular */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[130px] z-[1] pointer-events-none"
            animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.12, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <motion.div
          className="container mx-auto px-4 md:px-6 relative z-10"
          style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <div className="max-w-3xl text-white">
            <motion.p
              initial={reduced ? undefined : { opacity: 0, y: 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex items-center gap-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-accent mb-5 sm:mb-6"
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-accent soft-pulse" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-accent" />
              </span>
              Voltac Systems
            </motion.p>

            <TextReveal
              as="h1"
              className="display-1 mb-6"
              delay={0.1}
              segments={[
                { text: "Más resultados." },
                { text: "Menos trabajo manual.", highlight: true },
              ]}
            />

            <motion.p
              initial={reduced ? undefined : { opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
              className="lead text-white/70 max-w-xl mb-10"
            >
              Identificamos las tareas que le están costando horas a su organización y las
              convertimos en procesos que se hacen solos. Para empresas y profesionales de cualquier
              sector.
            </motion.p>

            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 16 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/cotizar">
                <Button variant="accent" size="lg" className="shine w-full sm:w-auto h-12 px-7 text-sm group">
                  Agendar conversación
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/servicios">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 text-sm text-white border-white/25 hover:bg-white/10 hover:border-white backdrop-blur-sm"
                >
                  Ver los servicios
                </Button>
              </Link>
            </motion.div>

            <motion.p
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              className="text-xs md:text-sm text-white/45 font-light mt-8 tracking-wide"
            >
              Resultados en semanas, no en años · Entregas que puede probar cada dos semanas
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* 2. Marcas con las que trabajamos */}
      <PartnersMarquee />

      {/* 3. Servicios */}
      <section className="py-16 sm:py-20 md:py-24 bg-white text-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-[0.4] mask-fade-y pointer-events-none" aria-hidden />

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 md:mb-16">
            <div className="max-w-2xl">
              <Reveal>
                <p className="eyebrow mb-4">Lo que hacemos</p>
              </Reveal>
              <TextReveal
                as="h2"
                className="display-2 mb-4"
                segments={[{ text: "Servicios con" }, { text: "un mismo objetivo.", highlight: true }]}
              />
              <Reveal delay={0.15}>
                <p className="lead text-secondary/70">
                  Cada servicio resuelve un problema concreto. Se contratan por separado o
                  combinados, según lo que hoy más le esté costando. Si no sabe por dónde empezar, se
                  empieza por el primero.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="shrink-0">
              <Link
                href="/servicios"
                className="font-semibold text-primary hover:text-accent uppercase tracking-wider inline-flex items-center gap-2 group transition-colors text-sm"
              >
                Ver el portafolio
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
          </div>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.07}>
            {/* Servicio 01: punto de partida, destacado a lo ancho */}
            <RevealItem className="md:col-span-2 lg:col-span-3">
              <SpotlightCard className="group h-full overflow-hidden rounded-2xl bg-muted border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 card-pad md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 md:items-center">
                <Link
                  href={`/servicios#${primaryService.slug}`}
                  className="absolute inset-0 z-20"
                  aria-label={primaryService.title}
                />
                <div className="relative w-14 h-14 rounded-xl bg-white border border-border/50 text-primary flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-500 shrink-0">
                  <PrimaryIcon size={28} />
                </div>
                <div className="flex-1 relative">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-black text-secondary/20 tracking-tighter">
                      {primaryService.number}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      Por aquí se empieza
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-secondary leading-tight">
                    {primaryService.title}
                  </h3>
                  <p className="text-secondary/60 font-light leading-relaxed text-sm italic">
                    “{primaryService.quote}”
                  </p>
                  <span className="mt-4 text-xs font-bold uppercase tracking-wider text-primary inline-flex items-center gap-2">
                    Ver en detalle
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <ServiceVisual
                  slug={primaryService.slug}
                  scale={0.85}
                  className="relative w-full md:w-[260px] shrink-0"
                />
              </SpotlightCard>
            </RevealItem>

            {otherServices.map((service) => {
              const Icon = service.icon;
              return (
                <RevealItem key={service.slug}>
                  <SpotlightCard className="group card-pad h-full rounded-2xl bg-muted border border-border/50 hover:bg-white hover:shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col">
                    <Link
                      href={`/servicios#${service.slug}`}
                      className="absolute inset-0 z-20"
                      aria-label={service.title}
                    />
                    {/* Miniatura animada con el icono y el número superpuestos */}
                    <ServiceVisual slug={service.slug} scale={0.78} className="relative mb-5">
                      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
                        <span className="w-9 h-9 rounded-lg bg-white border border-border/60 text-primary flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                          <Icon size={18} />
                        </span>
                        <span className="text-2xl font-black text-secondary/15 tracking-tighter leading-none transition-colors duration-500 group-hover:text-primary/30">
                          {service.number}
                        </span>
                      </div>
                    </ServiceVisual>

                    <h3 className="relative text-xl font-bold mb-3 text-secondary leading-tight">
                      {service.title}
                    </h3>
                    <p className="relative text-secondary/60 font-light leading-relaxed text-sm italic mb-4">
                      “{service.quote}”
                    </p>
                    <span className="relative mt-auto pt-2 text-xs font-bold uppercase tracking-wider text-primary inline-flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 lg:-translate-x-2 lg:group-hover:translate-x-0 transition-all duration-300">
                      Ver en detalle <ArrowRight size={14} />
                    </span>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>

          {/* CTA a lo ancho, fuera de la grilla de servicios */}
          <Reveal delay={0.1}>
            <div className="mt-6 relative overflow-hidden rounded-2xl bg-ink text-white card-pad md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute inset-0 bg-grid opacity-[0.35] mask-fade-radial" aria-hidden />
              <div className="relative max-w-2xl">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 leading-tight">
                  ¿No sabe por dónde empezar?
                </h3>
                <p className="text-white/60 font-light text-sm md:text-base leading-relaxed">
                  Empecemos por una conversación de 30 minutos. Le decimos con franqueza si hay algo
                  que valga la pena resolver.
                </p>
              </div>
              <Link href="/cotizar" className="relative shrink-0">
                <Button variant="accent" size="lg" className="shine h-12 px-8 text-sm w-full md:w-auto group">
                  Hablemos
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Por qué Voltac */}
      <section className="py-16 sm:py-20 md:py-24 bg-secondary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-[0.25] mask-fade-y pointer-events-none" aria-hidden />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[150px] rounded-full" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-8">
              <TextReveal
                as="h2"
                className="display-2"
                segments={[{ text: "¿Por qué" }, { text: "Voltac?", highlight: true }]}
              />
              <Reveal delay={0.1}>
                <p className="lead text-white/70">
                  Nuestro origen está en la industria, y de ahí viene nuestra forma de trabajar:
                  primero entendemos cómo funciona el negocio, después elegimos la tecnología. Nunca
                  al revés. El resultado es siempre el mismo: menos horas perdidas, menos errores y
                  más capacidad de atender sin contratar más personal.
                </p>
              </Reveal>

              <RevealGroup className="space-y-6" stagger={0.1}>
                {PILLARS.map((item) => (
                  <RevealItem key={item.title} className="flex gap-4 items-start group">
                    <div className="mt-1 bg-primary/20 p-2 rounded-lg text-accent border border-primary/30 group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-400">
                      <Check size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">{item.title}</h3>
                      <p className="text-white/60 font-light text-sm md:text-base leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <Reveal direction="left" distance={40} delay={0.15}>
              <div className="relative h-[280px] sm:h-[380px] lg:h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.15)] group">
                <Image
                  src="/Voltac_enviroment.png"
                  alt="Equipo de Voltac Systems trabajando en soluciones de automatización"
                  fill
                  className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent" />
                {/* Marco técnico sobre la imagen */}
                <div className="absolute inset-4 border border-white/10 rounded-xl pointer-events-none" aria-hidden />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. A quién atendemos */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted border-y border-border/50 relative overflow-hidden">
        <div className="absolute -left-32 -top-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
            <Reveal>
              <p className="eyebrow mb-4">A quién atendemos</p>
            </Reveal>
            <TextReveal
              as="h2"
              className="display-2 text-secondary mb-4"
              segments={[{ text: "Sectores donde" }, { text: "ya resolvemos.", highlight: true }]}
            />
            <Reveal delay={0.12}>
              <p className="lead text-secondary/60">
                La tecnología es la misma; lo que cambia es el problema de cada oficio.
              </p>
            </Reveal>
          </div>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.06}>
            {SECTORS.map((sector) => {
              const Icon = sector.icon;
              return (
                <RevealItem key={sector.name}>
                  <SpotlightCard
                    className="bg-white card-pad h-full rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-400 flex flex-col group"
                    radius={200}
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-muted text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-400">
                      <Icon size={24} />
                    </div>
                    <h3 className="relative font-black text-secondary mb-3 leading-tight">
                      {sector.name}
                    </h3>
                    <p className="relative text-sm text-secondary/60 font-light leading-relaxed">
                      {sector.description}
                    </p>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.1} className="mt-16 text-center">
            <Link href="/proyectos">
              <Button
                variant="outline"
                className="shine border-secondary text-secondary hover:bg-secondary hover:text-white rounded-full font-bold uppercase tracking-wider h-12 px-8 text-xs gap-3 transition-colors shadow-sm"
              >
                Ver trabajos que ya entregamos <Activity size={16} />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 6. CTA final */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <Reveal>
            <div className="bg-secondary text-white rounded-[2rem] p-8 sm:p-10 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-30 mask-fade-radial" aria-hidden />
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/25 rounded-full blur-[100px]"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className="relative z-10 max-w-3xl">
                <TextReveal
                  as="h2"
                  className="display-2 mb-6"
                  segments={[{ text: "Empecemos por una conversación de" }, { text: "30 minutos.", highlight: true }]}
                />
                <Reveal delay={0.15}>
                  <p className="lead text-white/70 mb-10">
                    Cuéntenos qué tarea le está consumiendo más tiempo, qué cliente se le está
                    escapando o qué requisito cumple con angustia cada mes. Le decimos con franqueza
                    si tiene solución, cuál sería y en cuánto tiempo se vería el resultado. Sin costo
                    y sin compromiso.
                  </p>
                </Reveal>
                <Reveal delay={0.25}>
                  <Link href="/cotizar">
                    <Button variant="accent" size="lg" className="shine h-12 px-8 rounded-full text-sm group">
                      Quiero esa conversación
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
