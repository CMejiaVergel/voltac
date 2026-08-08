import * as React from "react";
import Image from "next/image";
import { MapPin, Zap, Sun, Award, ArrowRight, TreeDeciduous, Banknote } from "lucide-react";
import { getDB } from "@/lib/db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Proyectos y Casos de Éxito | Voltac Energy",
  description: "Portafolio de granjas solares, residenciales y comerciales construidas por Voltac. Visualiza nuestras métricas de impacto ambiental y económico.",
};

export default async function ProyectosPage() {
  const db = await getDB();
  const allProjects = await db.all("SELECT * FROM projects");
  const publishedProjects = allProjects.filter((p: any) => p.isPublished === 1).sort((a: any, b: any) => b.id - a.id);
  
  const rawMwp = allProjects.reduce((acc: number, p: any) => acc + (p.powerUnit === 'MW' ? p.power : p.powerUnit === 'W' ? p.power/1000000 : p.power/1000), 0);
  const mwpAcumulado = rawMwp < 1 ? (rawMwp * 1000).toFixed(0) : rawMwp.toFixed(2);
  const energyUnit = rawMwp < 1 ? 'kWp' : 'MWp';
  
  const co2Acumulado = allProjects.reduce((acc: number, p: any) => acc + parseFloat(p.co2calc || 0), 0).toFixed(0);
  const ahorroAcumulado = allProjects.reduce((acc: number, p: any) => acc + parseFloat(p.savingsCalc || 0), 0);

  const COP_Ahorro = ahorroAcumulado >= 1000000000000
    ? { val: (ahorroAcumulado/1000000000000).toFixed(1), suf: 'Billones' }
    : ahorroAcumulado >= 1000000 
      ? { val: (ahorroAcumulado/1000000).toFixed(1), suf: 'Millones' } 
      : { val: ahorroAcumulado.toLocaleString(), suf: '' };

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-4xl text-center mx-auto mb-16 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-black text-secondary tracking-tight">
            Impacto que se <span className="text-primary">Ve y Siente.</span>
          </h1>
          <p className="text-xl text-secondary/60 font-light leading-relaxed max-w-2xl mx-auto">
            Portafolio destacado de instalaciones recientes con resultados medibles en reducción de costos de energía y captura de carbono.
          </p>
        </header>

        <section className="bg-secondary rounded-[2.5rem] p-10 md:p-14 mb-20 shadow-2xl relative overflow-hidden text-center text-white">
          <div className="absolute inset-0 bg-[url('/Ejemplo%201.jpeg')] bg-cover opacity-10 mix-blend-screen" />
          <h2 className="text-sm tracking-widest uppercase font-bold text-accent mb-10 relative z-10">Métricas Globales Acumuladas</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 divide-x divide-white/10">
            <div className="space-y-2 py-4">
              <p className="text-5xl font-black tracking-tighter tabular-nums">{allProjects.length}</p>
              <p className="text-white/60 font-medium">Proyectos Finalizados</p>
            </div>
            <div className="space-y-2 py-4">
              <p className="text-5xl font-black tracking-tighter text-primary tabular-nums">{mwpAcumulado}<span className="text-2xl">{energyUnit}</span></p>
              <p className="text-white/60 font-medium text-sm">Potencia Instalada</p>
            </div>
            <div className="space-y-2 py-4 hidden md:block">
              <p className="text-5xl font-black tracking-tighter text-primary tabular-nums">{co2Acumulado}<span className="text-2xl ml-1">ton</span></p>
              <p className="text-white/60 font-medium text-sm leading-tight">Toneladas de CO₂ eq reducidas anualmente</p>
            </div>
            <div className="space-y-2 py-4 hidden md:block">
              <p className="text-5xl font-black tracking-tighter tabular-nums text-primary">
                 <span className="text-2xl">$</span>{COP_Ahorro.val}
                 {COP_Ahorro.suf && <span className="text-xl ml-2 text-primary">{COP_Ahorro.suf}</span>}
              </p>
              <p className="text-white/60 font-medium text-sm leading-tight">Ahorro en COP proyectado clientes</p>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedProjects.length === 0 ? (
             <div className="col-span-3 py-20 text-center font-bold text-secondary/50">El equipo técnico publicará métricas fotovoltaicas pronto.</div>
          ) : (
            publishedProjects.map((project: any) => (
              <div key={project.id} className="group rounded-[2rem] overflow-hidden bg-white border border-border shadow-md hover:shadow-2xl transition-all h-full flex flex-col">
                
                <div className="relative h-64 w-full overflow-hidden bg-muted">
                  {project.imageUrl && (
                    <Image src={project.imageUrl} alt={project.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-secondary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold capitalize">
                      {project.projectType}
                    </span>
                    <span className="bg-primary/90 backdrop-blur-md text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {project.power} {project.powerUnit}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-secondary group-hover:text-primary transition-colors leading-tight mb-4">
                    {project.name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="flex items-center gap-2 text-secondary/70">
                        <MapPin size={16} className="text-primary"/>
                        <p className="font-bold text-sm truncate">{project.city}</p>
                     </div>
                     <div className="flex items-center gap-2 text-secondary/70">
                        <Sun size={16} className="text-primary"/>
                        <p className="font-bold text-sm truncate">{project.connectionType}</p>
                     </div>
                  </div>

                  {/* Impact Showcase Area */}
                  <div className="bg-secondary p-5 flex-1 rounded-[1.5rem] flex flex-col">
                     <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-4">Impacto Energético</h4>
                     
                     <div className="flex gap-4 mb-6">
                        {project.reductionPercent > 0 && (
                          <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-bl-full -mr-8 -mt-8"></div>
                             <p className="text-3xl font-black text-primary leading-none mb-1">-{project.reductionPercent}%</p>
                             <p className="text-[10px] font-medium text-white/70 uppercase leading-tight">Gasto Energía</p>
                          </div>
                        )}
                        {project.roiRange && (
                          <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                             <p className="text-xl font-black text-white leading-none mb-1 mt-1">{project.roiRange}</p>
                             <p className="text-[10px] font-medium text-white/70 uppercase leading-tight mt-1.5">Retorno Inversión (ROI)</p>
                          </div>
                        )}
                     </div>

                     <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex gap-2 items-center">
                           <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><TreeDeciduous size={16}/></div>
                           <div>
                             <p className="text-[10px] font-bold uppercase text-white/50">CO₂ Anual</p>
                             <p className="font-black text-white text-sm">-{parseFloat(project.co2calc).toFixed(1)} ton</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold uppercase text-white/50">Ahorro Anual</p>
                           <p className="font-black text-primary text-sm">${parseFloat(project.savingsCalc).toLocaleString('es-CO')}</p>
                        </div>
                     </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-20 flex justify-center">
          <Link href="/cotizar">
             <button className="bg-primary text-secondary px-8 py-4 rounded-full font-black text-lg gap-2 flex items-center hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105">
               Cotiza uno igual para ti <ArrowRight/>
             </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
