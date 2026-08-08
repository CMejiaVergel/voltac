import * as React from "react";
import { Users, FolderKanban, Zap, Newspaper, Clock } from "lucide-react";
import { getDB } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const db = await getDB();
  
  // -- Leads data
  const leads = await db.all('SELECT * FROM quotes WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY id DESC');
  const activeLeadsCount = leads.filter(l => l.stage !== 'Ganado' && l.stage !== 'Perdido').length;
  const recentLeads = leads.slice(0, 5);

  // -- Projects data
  const projects = await db.all("SELECT * FROM projects");
  const publishedProjects = projects.filter((p: any) => p.isPublished === 1);
  const rawMwp = publishedProjects.reduce((acc: number, p: any) => acc + (p.powerUnit === 'MW' ? p.power : p.powerUnit === 'W' ? p.power/1000000 : p.power/1000), 0);
  const mwpAcumulado = rawMwp < 1 ? (rawMwp * 1000).toFixed(0) + ' kWp' : rawMwp.toFixed(1) + ' MWp';
  const recentProjects = publishedProjects.sort((a: any, b: any) => b.id - a.id).slice(0, 3);

  // -- News data
  const news = await db.all("SELECT * FROM news_entries WHERE estado = 1 ORDER BY fecha_publicacion DESC");
  const recentNews = news.slice(0, 3);

  const metrics = [
    { label: "Leads Activos", value: activeLeadsCount.toString(), change: "Atención comercial", icon: <Users size={24} className="text-blue-500" /> },
    { label: "Proyectos Publicados", value: publishedProjects.length.toString(), change: "Portafolio web", icon: <FolderKanban size={24} className="text-orange-500" /> },
    { label: "Potencia Pública", value: mwpAcumulado, change: "Expuesta a clientes", icon: <Zap size={24} className="text-yellow-500" /> },
    { label: "Noticias/Artículos", value: news.length.toString(), change: "SEO y redes sociales", icon: <Newspaper size={24} className="text-accent" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-secondary tracking-tight">Dashboard General</h1>
        <p className="text-secondary/60">Bienvenido al panel de control de Voltac Energy.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary/5 rounded-xl">{m.icon}</div>
            </div>
            <div>
              <p className="text-secondary/60 font-medium text-sm mb-1">{m.label}</p>
              <h3 className="text-3xl font-black tracking-tighter text-secondary">{m.value}</h3>
              <p className="text-xs text-secondary/40 font-medium mt-2">{m.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Ultimos Leads Registrados */}
         <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full lg:col-span-1">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={18} className="text-secondary/50"/> Últimos Leads Registrados</h3>
           <div className="space-y-4 flex-1">
             {recentLeads.length === 0 ? (
                <p className="text-sm text-secondary/50 italic py-6 text-center">No hay leads todavía.</p>
             ) : (
               recentLeads.map((lead: any) => (
                 <Link href={`/admin/leads?id=${lead.id}`} key={lead.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted transition-colors">
                   <div>
                     <p className="font-bold text-sm text-secondary flex items-center gap-2">
                       {lead.fullName.split(' ')[0]} {lead.priority === 'Alta' && <span className="w-2 h-2 rounded-full bg-red-500" title="Prioridad Alta"/>}
                     </p>
                     <p className="text-[10px] text-secondary/60 mt-1 capitalize">{lead.modality}</p>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-md uppercase tracking-wider">{lead.stage}</span>
                     <span className="text-[10px] text-secondary/40 uppercase font-mono">{new Date(lead.createdAt).toLocaleDateString('es-CO')}</span>
                   </div>
                 </Link>
               ))
             )}
           </div>
         </div>

         {/* Proyectos Recientes */}
         <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full lg:col-span-1">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FolderKanban size={18} className="text-orange-500"/> Proyectos Recientes</h3>
           <div className="space-y-4">
             {recentProjects.length === 0 ? (
                <p className="text-sm text-secondary/50 italic py-6 text-center">No hay proyectos publicados.</p>
             ) : (
               recentProjects.map((p:any) => (
                 <Link href="/admin/proyectos" key={p.id} className="flex gap-4 items-center p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted transition-colors">
                   <div className="w-12 h-12 bg-secondary/10 rounded-lg overflow-hidden relative shrink-0">
                      {p.imageUrl && <Image src={p.imageUrl} alt="" fill className="object-cover"/>}
                   </div>
                   <div>
                     <p className="font-bold text-sm text-secondary line-clamp-1">{p.name || 'Sin título'}</p>
                     <p className="text-[10px] uppercase tracking-widest text-secondary/60 font-bold">{p.department} - {p.power} {p.powerUnit}</p>
                   </div>
                 </Link>
               ))
             )}
           </div>
         </div>

         {/* Noticias Recientes */}
         <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full lg:col-span-1">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Newspaper size={18} className="text-accent"/> Últimas Noticias</h3>
           <div className="space-y-4">
             {recentNews.length === 0 ? (
                <p className="text-sm text-secondary/50 italic py-6 text-center">No hay noticias publicadas.</p>
             ) : (
               recentNews.map((n:any) => (
                 <Link href="/admin/news" key={n.id} className="flex gap-4 items-center p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted transition-colors">
                   <div className="w-12 h-12 bg-secondary/10 rounded-lg overflow-hidden relative shrink-0">
                      {n.imagen_portada && <Image src={n.imagen_portada} alt="" fill className="object-cover"/>}
                   </div>
                   <div>
                     <p className="font-bold text-sm text-secondary line-clamp-2 leading-tight">{n.titulo}</p>
                     <p className="text-[10px] text-secondary/50 mt-1 font-mono">{new Date(n.fecha_publicacion).toLocaleDateString('es-CO')}</p>
                   </div>
                 </Link>
               ))
             )}
           </div>
         </div>
      </div>
    </div>
  );
}
