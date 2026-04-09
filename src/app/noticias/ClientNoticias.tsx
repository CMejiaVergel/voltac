"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, User, Tag } from "lucide-react";

export default function ClientNoticias({ newsList }: { newsList: any[] }) {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-white text-secondary">
      {/* Header */}
      <section className="bg-secondary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Blog <span className="text-primary">Técnico.</span>
          </h1>
          <p className="text-lg text-white/80 font-light leading-relaxed">
            Actualidad y conocimiento curado sobre Inteligencia artificial, desarrollo de software automatización B2B. Optimiza tu negocio con información valiosa de nuestros top ingenieros.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          {newsList.length === 0 ? (
             <div className="py-20 text-center text-secondary/50 font-medium">Aún no hay artículos publicados en el blog.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsList.map((news, i) => {
                const plainText = news.cuerpo.replace(/<[^>]+>/g, '');
                const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
                
                let category = "Artículo Técnico";
                try {
                  const kw = JSON.parse(news.keywords || "[]");
                  if (kw.length > 0) category = kw[0];
                } catch(e) {}

                return (
                  <motion.div 
                    key={news.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Link href={`/noticias/${news.slug}`} className="group block h-full bg-muted border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all hover:border-primary/30 flex flex-col cursor-pointer">
                      <div className="relative h-56 w-full overflow-hidden bg-white/50">
                         {news.imagen_portada ? (
                            <Image src={news.imagen_portada} alt={news.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-secondary/20 font-black text-2xl">VOLTAC</div>
                         )}
                         <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                            <Tag size={12}/> {category}
                         </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1 relative bg-white h-full">
                        <div className="flex items-center gap-4 mb-4 text-[10px] sm:text-xs font-bold text-secondary/50 uppercase tracking-widest flex-wrap">
                           <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(news.fecha_publicacion).toLocaleDateString('es-CO')}</span>
                           <span className="flex items-center gap-1.5"><User size={14}/> Autor</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black mb-4 group-hover:text-primary transition-colors leading-tight text-secondary">
                          {news.titulo}
                        </h3>
                        <p className="text-secondary/70 font-light text-sm md:text-base leading-relaxed mb-6 flex-1">
                          {excerpt}
                        </p>
                        <div className="flex items-center text-primary font-bold text-sm gap-2 uppercase tracking-widest group-hover:gap-4 transition-all mt-auto">
                          Leer Artículo <ArrowRight size={16}/>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
