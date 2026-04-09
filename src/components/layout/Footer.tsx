"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone, Cpu } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-secondary text-white/80 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 bg-secondary pb-12">
          {/* Brand */}
          <div className="max-w-xs space-y-4">
            <Link href="/" className="inline-block relative">
               <Image 
                src="/Logo_fondo_oscuro.png" 
                alt="Voltac Systems Logo" 
                width={180} 
                height={50} 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 leading-relaxed font-light">
              Desarrollamos e implementamos agentes de Inteligencia Artificial, automatización corporativa y software a medida para escalar a tu empresa al siguiente nivel.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider">Enlaces Rápidos</h4>
            <ul className="space-y-3 font-light text-white/60">
              <li><Link href="/servicios" className="hover:text-accent transition-colors">Servicios IA & Web</Link></li>
              <li><Link href="/proyectos" className="hover:text-accent transition-colors">Proyectos</Link></li>
              <li><Link href="/noticias" className="hover:text-accent transition-colors">Blog Técnico</Link></li>
              <li><Link href="/contacto" className="hover:text-accent transition-colors">Contacto</Link></li>
              <li><Link href="/cotizar" className="hover:text-accent transition-colors">Cotizar Proyecto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-4 font-light text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span>Sedes: Cartagena, Sincelejo,<br/>Barranquilla y Medellín</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <span>+57 313 625 3584</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="flex flex-col gap-1">
                  <span>sales@voltac.com.co</span>
                  <span>dev@voltac.com.co</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Certification / CTA */}
          <div className="space-y-4 flex flex-col items-start bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <h4 className="font-bold text-white text-lg leading-tight flex items-center gap-2">
              <Cpu size={24} className="text-accent" />
              Tecnología Vanguardista
            </h4>
            <p className="text-white/60 leading-relaxed font-light text-xs">
              Aplicamos metodologías ágiles (Scrum) y arquitecturas Cloud/AI (AWS, OpenAI) para garantizar escalabilidad y alto rendimiento.
            </p>
            <Link
              href="/cotizar"
              className="mt-4 px-5 py-2 inline-flex font-semibold text-xs tracking-wider border border-accent text-accent uppercase rounded-lg hover:bg-accent hover:text-secondary transition-colors"
            >
              Consulta Tecnológica Gratuita
            </Link>
          </div>
        </div>

        <div className="pt-8 mt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-light">
          <p>© {new Date().getFullYear()} Voltac Systems. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
