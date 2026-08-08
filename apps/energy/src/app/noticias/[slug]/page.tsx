import { getDB } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import { ShareButtons } from "./ShareButtons";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDB();
  const entry = await db.get("SELECT titulo, cuerpo, imagen_portada, keywords FROM news_entries WHERE slug = ? AND estado = 1", [slug]);

  if (!entry) return {};

  const plainText = entry.cuerpo.replace(/<[^>]+>/g, '').substring(0, 160);
  const keywordArray = entry.keywords ? JSON.parse(entry.keywords) : [];

  return {
    title: `${entry.titulo} | Voltac Energy`,
    description: plainText,
    keywords: keywordArray,
    openGraph: {
      title: entry.titulo,
      description: plainText,
      images: entry.imagen_portada ? [entry.imagen_portada] : [],
      type: "article",
    }
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDB();
  const article = await db.get("SELECT * FROM news_entries WHERE slug = ? AND estado = 1", [slug]);

  if (!article) return notFound();

  // Fetch related news (last 3 published, excluding current)
  const relatedNews = await db.all("SELECT id, titulo, slug, imagen_portada, fecha_publicacion FROM news_entries WHERE estado = 1 AND id != ? ORDER BY fecha_publicacion DESC LIMIT 4", [article.id]);

  return (
    <div className="bg-background min-h-screen">
      
      {/* ── HERO DE LA NOTICIA (ANCHO COMPLETO) ── */}
      <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex flex-col justify-end pt-32 pb-16">
         {/* Background Image */}
         {article.imagen_portada ? (
            <div className="absolute inset-0 z-0">
               <Image src={article.imagen_portada} fill alt={article.titulo} className="object-cover" priority/>
            </div>
         ) : (
            <div className="absolute inset-0 z-0 bg-secondary" />
         )}

         {/* Gradient Overlay for Text Contrast */}
         <div className="absolute inset-0 z-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent" />
         
         <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
            <h1 className={`font-black text-white tracking-tight leading-[1.1] mb-6 text-balance mx-auto ${article.titulo.length > 70 ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-3xl md:text-5xl lg:text-7xl'}`}>
               {article.titulo}
            </h1>
            
            <div className="flex items-center justify-center gap-3 text-sm md:text-base font-bold tracking-widest text-white uppercase">
               <Calendar size={18} className="text-white/80"/>
               {new Date(article.fecha_publicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
         </div>
      </section>

      {/* ── CUERPO PRINCIPAL Y SIDEBAR ── */}
      <div className="container mx-auto px-4 md:px-6 py-16">
         <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Lado Izquierdo: Artículo */}
            <div className="lg:col-span-8">
               <article 
                  className="prose prose-sm sm:prose-base lg:prose-lg prose-headings:font-black prose-headings:text-secondary prose-p:text-secondary/80 prose-a:text-primary prose-a:font-bold hover:prose-a:text-primary/80 prose-img:rounded-3xl prose-img:shadow-lg max-w-none 
                  prose-img:inline-block md:prose-img:max-w-[48%] prose-img:mx-1 prose-img:my-4 prose-img:object-cover"
                  dangerouslySetInnerHTML={{ __html: article.cuerpo }}
               />
               
               {/* Fuentes */}
               {article.fuentes && (
                 <div className="mt-8 pt-4 border-t border-border">
                    <p className="text-xs italic text-secondary/60 whitespace-pre-wrap leading-relaxed">
                      <span className="font-bold mr-1">Fuentes:</span> {article.fuentes}
                    </p>
                 </div>
               )}

               {/* Redes Sociales y Compartir */}
               <ShareButtons slug={article.slug} />

               {/* Etiquetas */}
               {article.keywords && JSON.parse(article.keywords).length > 0 && (
                 <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-xs uppercase font-bold text-secondary/50 tracking-widest mb-4">Etiquetas relacionadas</p>
                    <div className="flex gap-2 flex-wrap">
                      {JSON.parse(article.keywords).map((kw: string, i: number) => (
                        <span key={i} className="bg-muted text-secondary/70 text-xs px-3 py-1.5 rounded-full font-medium">#{kw}</span>
                      ))}
                    </div>
                 </div>
               )}
            </div>

            {/* Lado Derecho: Sidebar de Noticias Relacionadas */}
            <aside className="lg:col-span-4 space-y-8">
               <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 md:p-8 sticky top-28">
                  <h3 className="text-xl font-black text-secondary tracking-tight mb-6 flex items-center gap-3">
                     <span className="w-8 h-1 bg-primary rounded-full"></span> 
                     Noticias de interés
                  </h3>

                  {relatedNews.length === 0 ? (
                     <p className="text-sm font-light text-secondary/50">Por ahora no hay más opciones disponibles.</p>
                  ) : (
                     <div className="space-y-6">
                        {relatedNews.map((rn: any) => (
                           <Link key={rn.id} href={`/noticias/${rn.slug}`} className="group flex flex-col gap-3">
                              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
                                {rn.imagen_portada ? (
                                   <Image src={rn.imagen_portada} alt={rn.titulo} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                   <div className="absolute inset-0 flex items-center justify-center bg-secondary/5">
                                      <span className="text-secondary/20 font-black text-xl">VOLTAC</span>
                                   </div>
                                )}
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-secondary leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                    {rn.titulo}
                                 </h4>
                                 <p className="text-[10px] uppercase tracking-widest text-secondary/50 mt-1 font-bold">
                                    {new Date(rn.fecha_publicacion).toLocaleDateString()}
                                 </p>
                              </div>
                           </Link>
                        ))}
                     </div>
                  )}
                  
                  <Link href="/noticias" className="w-full mt-6 py-4 rounded-xl border border-border text-center text-secondary/80 font-bold text-sm tracking-widest uppercase hover:bg-muted transition-colors flex items-center justify-center gap-2">
                     Ver todas <ArrowRight size={16}/>
                  </Link>
               </div>
            </aside>

         </div>
      </div>
    </div>
  );
}
