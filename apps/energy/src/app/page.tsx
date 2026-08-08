"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Target, ShieldCheck, Leaf, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublishedProjects } from "./admin/proyectos/actions";
import { getLatestNews } from "./admin/news/actions";
import { Calendar } from "lucide-react";

const METRICS = [
  { label: "Instalación", value: "< 7 días", suffix: "" },
  { label: "Vida útil", value: "~30", suffix: " años" },
  { label: "Ahorro", value: "100", prefix: "Hasta ", suffix: "%" },
  { label: "Proyectos", value: "120", suffix: "+" },
  { label: "kWp Instalados", value: "3.5", suffix: "k" },
  { label: "CO₂ Reducido", value: "850", suffix: " ton" },
];

const SERVICES = [
  { title: "Diagnóstico Energético", icon: <PieChart size={32} /> },
  { title: "Ingeniería y Diseño", icon: <Activity size={32} /> },
  { title: "Construcción e Instalación", icon: <Target size={32} /> },
  { title: "Comisionamiento", icon: <Zap size={32} /> },
  { title: "Operación y Mantenimiento", icon: <ShieldCheck size={32} /> },
  { title: "Certificación Renovable", icon: <Leaf size={32} /> },
];

export default function Home() {
  const [publishedProjects, setPublishedProjects] = React.useState<any[]>([]);
  const [latestNews, setLatestNews] = React.useState<any[]>([]);

  React.useEffect(() => {
    getPublishedProjects().then(data => setPublishedProjects(data));
    getLatestNews().then(data => setLatestNews(data));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fondo_hero.png"
            alt="Instalación de paneles solares Voltac"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/40 to-secondary" />
        </div>

        <div className="container mx-auto px-6 md:px-12 lg:px-32 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl space-y-8 text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md text-accent text-sm font-semibold tracking-wider">
              <Zap size={16} className="text-accent" />
              Líderes en Paneles Solares e Inteligencia Artificial en Colombia
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05]">
              Tu factura de energía<br className="hidden md:block"/> tiene los días contados.
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl leading-relaxed">
              La principal empresa de diseño e instalación de soluciones fotovoltaicas en la Costa Caribe y Colombia. Ahorra inteligentemente integrando nuestras herramientas de IA en tu hogar, comercio o industria petrolera.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/cotizar">
                <Button variant="accent" size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
                  Cotiza tu sistema <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/proyectos">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base text-white border-white/30 hover:bg-white/10 hover:border-white">
                  Ver proyectos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Metrics of Impact */}
      <section className="py-12 bg-secondary border-t border-white/5 relative z-20 -mt-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {METRICS.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-center justify-center text-center space-y-2 group"
              >
                <div className="text-4xl md:text-5xl font-black text-primary transition-transform group-hover:scale-110 group-hover:text-accent">
                  <span className="text-2xl">{metric.prefix}</span>
                  {metric.value}
                  <span className="text-2xl">{metric.suffix}</span>
                </div>
                <div className="text-sm font-medium text-white/60 uppercase tracking-widest">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Services */}
      <section className="py-24 bg-white text-secondary">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Ingeniería que <span className="text-primary">impulsa tu futuro.</span></h2>
              <p className="text-lg text-secondary/70 font-light">
                Brindamos un acompañamiento 360° en cada etapa de tu proyecto solar, garantizando los más altos estándares de calidad y seguridad.
              </p>
            </div>
            <Link href="/servicios" className="font-semibold text-primary hover:text-accent uppercase tracking-wider inline-flex items-center gap-2 group transition-colors">
              Ver todos los servicios <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-muted border border-border/50 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-white border border-border/50 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-secondary/60 font-light line-clamp-2">
                  Implementación de soluciones avanzadas garantizando cumplimiento normativo y alto rendimiento energético.
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.1 Public Projects Reel */}
      {publishedProjects.length > 0 && (
        <section className="py-24 bg-muted border-y border-border/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-4xl font-black text-secondary tracking-tight mb-4 text-balance">Realidades <span className="text-primary">Solares.</span></h2>
              <p className="text-secondary/60">Últimas obras interconectadas entregando ahorro y sustentabilidad en este mismo instante.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {publishedProjects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group rounded-[2rem] overflow-hidden bg-white border border-border shadow-md flex flex-col cursor-pointer">
                    <div className="h-48 relative overflow-hidden bg-secondary">
                      {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />}
                      <div className="absolute top-4 left-4 bg-secondary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{p.power} {p.powerUnit}</div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-black text-secondary text-xl border-b border-border pb-4 mb-4">{p.name}</h3>
                      <div className="flex justify-between items-center bg-secondary/5 rounded-xl p-3 border border-border">
                         <div>
                            <p className="text-[10px] uppercase font-bold text-secondary/50 mb-0.5">Ahorro Analizado</p>
                            <p className="text-primary font-black text-base leading-none">${parseFloat(p.savingsCalc).toLocaleString('es-CO')}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-secondary/50 mb-0.5">CO₂ Evitado</p>
                            <p className="text-green-600 font-black text-base leading-none">-{parseFloat(p.co2calc).toFixed(1)} t</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
               ))}
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/proyectos">
                <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white rounded-full font-bold uppercase tracking-wider h-12 px-8">Explorar Portafolio Completo</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. Why Voltac Energy */}
      <section className="py-24 bg-secondary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[150px] rounded-full" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                ¿Por qué <span className="text-primary">Voltac Energy?</span>
              </h2>
              <ul className="space-y-6">
                {[
                  { title: "Instalación Rápida", desc: "Procesos optimizados para ejecutar viviendas en < 7 días." },
                  { title: "Certificación RETIE / RETILAP", desc: "Cumplimiento estricto de la norma eléctrica colombiana." },
                  { title: "Monitoreo Inteligente IA", desc: "Plataforma en tiempo real para predecir fallas y optimizar generación." },
                  { title: "Cobertura Nacional", desc: "Equipos de ingeniería en toda Colombia listos para operar." },
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="mt-1 bg-primary/20 p-2 rounded-lg text-accent">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                      <p className="text-white/60 font-light">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="relative h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image src="/Working_Home.png" alt="Instalación técnica" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 Noticias y Recursos */}
      {latestNews.length > 0 && (
        <section className="py-24 bg-white text-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Noticias y <span className="text-primary">Recursos.</span>
                </h2>
                <p className="text-lg text-secondary/70 font-light">
                  Aprende cómo la Inteligencia Artificial optimiza sistemas fotoeléctricos.
                </p>
              </div>
              <Link href="/noticias" className="font-semibold text-primary hover:text-accent uppercase tracking-wider inline-flex items-center gap-2 group transition-colors">
                Ver todas las noticias <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {latestNews.map((news: any) => {
                const plainText = news.cuerpo.replace(/<[^>]+>/g, '');
                const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
                return (
                  <Link key={news.id} href={`/noticias/${news.slug}`} className="group rounded-[2rem] overflow-hidden bg-muted/20 border border-border shadow-sm hover:shadow-2xl transition-all flex flex-col h-full">
                    <div className="relative h-48 w-full bg-muted overflow-hidden">
                      {news.imagen_portada ? (
                        <Image src={news.imagen_portada} alt={news.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/5">
                          <span className="text-secondary/20 font-black text-4xl">VOLTAC</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                        <Calendar size={14}/>
                        {new Date(news.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <h3 className="text-xl font-black text-secondary group-hover:text-primary transition-colors leading-tight mb-3">
                        {news.titulo}
                      </h3>
                      <p className="text-secondary/70 text-sm leading-relaxed mb-4 font-light flex-1">
                        {excerpt}
                      </p>
                      <div className="flex items-center text-primary font-bold text-sm gap-2 uppercase tracking-widest group-hover:gap-4 transition-all mt-auto">
                        Leer artículo <ArrowRight size={16}/>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Final CTA */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center text-white max-w-3xl">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-8 break-words text-balance">
            Crecer hoy es hacerlo responsablemente.
          </h2>
          <p className="text-xl md:text-2xl font-light mb-12 text-white/90">
            Convierte a tu empresa en un generador de energía limpia. Certifica tu impacto y aumenta tu rentabilidad.
          </p>
          <Link href="/cotizar">
            <Button variant="accent" size="lg" className="w-full sm:w-auto h-auto py-5 px-6 sm:px-10 text-base sm:text-lg whitespace-normal leading-tight text-center hover:scale-105 transition-transform mt-4">
              Empieza tu transformación hoy
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
