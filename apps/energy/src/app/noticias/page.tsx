import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { ArrowRight, Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Noticias y Recursos | Voltac Energy",
  description: "Explora nuestros artículos, guías y casos de estudio sobre energía fotovoltaica e Inteligencia Artificial en Colombia.",
};

export default async function NoticiasPage() {
  const db = await getDB();
  const publishedNews = await db.all("SELECT * FROM news_entries WHERE estado = 1 ORDER BY fecha_publicacion DESC");

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-4xl text-center mx-auto mb-16 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-black text-secondary tracking-tight">
            Noticias y <span className="text-primary">Recursos.</span>
          </h1>
          <p className="text-xl text-secondary/60 font-light leading-relaxed max-w-2xl mx-auto">
            Aprende cómo optimizar tu ahorro energético, las últimas tendencias en granjas solares y cómo la IA revoluciona el sector.
          </p>
        </header>

        {publishedNews.length === 0 ? (
           <div className="py-20 text-center bg-white rounded-3xl border border-border shadow-sm">
             <p className="text-secondary/50 font-medium text-lg">Pronto publicaremos nuestro primer artículo. ¡Mantente atento!</p>
           </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedNews.map((news: any) => {
              // Extraer texto limpio del HTML para el extracto corto
              const plainText = news.cuerpo.replace(/<[^>]+>/g, '');
              const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

              return (
                <Link key={news.id} href={`/noticias/${news.slug}`} className="group rounded-[2rem] overflow-hidden bg-white border border-border shadow-md hover:shadow-2xl transition-all h-full flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-56 w-full bg-muted overflow-hidden">
                    {news.imagen_portada ? (
                      <Image src={news.imagen_portada} alt={news.titulo} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary/5">
                        <span className="text-secondary/20 font-black text-4xl">VOLTAC</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido Card */}
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-primary">
                      <Calendar size={14}/>
                      {new Date(news.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    
                    <h3 className="text-2xl font-black text-secondary group-hover:text-primary transition-colors leading-tight mb-4">
                      {news.titulo}
                    </h3>
                    
                    <p className="text-secondary/70 text-sm leading-relaxed mb-6 font-light">
                      {excerpt}
                    </p>

                    <div className="mt-auto flex items-center text-primary font-bold text-sm gap-2 uppercase tracking-widest group-hover:gap-4 transition-all">
                      Leer artículo <ArrowRight size={16}/>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
