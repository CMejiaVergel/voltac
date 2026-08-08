"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone } from "lucide-react";

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

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
                src="/logo_fondo_oscuro.png" 
                alt="Voltac Energy Logo" 
                width={180} 
                height={50} 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 leading-relaxed font-light">
              Diseñamos, implementamos y operamos soluciones fotovoltaicas rentables que impulsan la transición energética en Colombia.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://www.instagram.com/voltacenergy/" target="_blank" rel="noopener noreferrer" aria-label="Perfil de Instagram de Voltac Energy" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <InstagramIcon />
              </a>
              <a href="http://linkedin.com/company/voltac-energy" target="_blank" rel="noopener noreferrer" aria-label="Perfil de LinkedIn de Voltac Energy" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <LinkedinIcon />
              </a>
              <a href="https://www.facebook.com/voltacenergy/" target="_blank" rel="noopener noreferrer" aria-label="Página de Facebook de Voltac Energy" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider">Enlaces Rápidos</h4>
            <ul className="space-y-3 font-light text-white/60">
              <li><Link href="/servicios" className="hover:text-accent transition-colors">Servicios</Link></li>
              <li><Link href="/proyectos" className="hover:text-accent transition-colors">Proyectos de Éxito</Link></li>
              <li><Link href="/inversion" className="hover:text-accent transition-colors">Inversión Solar</Link></li>
              <li><Link href="/nosotros" className="hover:text-accent transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contacto" className="hover:text-accent transition-colors">Contacto</Link></li>
              <li><Link href="/cotizar" className="hover:text-accent transition-colors">Cotizar Sistema</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-4 font-light text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span>Sedes: Cartagena, Sincelejo,<br/>Barranquilla, Medellín y Montería</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <span>+57 313 625 3584</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="flex flex-col gap-1">
                  <span>sales@voltac.com.co</span>
                  <span>projects@voltac.com.co</span>
                  <span>operations@voltac.com.co</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Certification / CTA */}
          <div className="space-y-4 flex flex-col items-start bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <h4 className="font-bold text-white text-lg leading-tight">Garantía RETIE / RETILAP</h4>
            <p className="text-white/60 leading-relaxed font-light text-xs">
              Cumplimos con todos los estándares técnicos y normativos colombianos para garantizar la seguridad operativa y confiabilidad de tu sistema.
            </p>
            <Link
              href="/cotizar"
              className="mt-4 px-5 py-2 inline-flex font-semibold text-xs tracking-wider border border-accent text-accent uppercase rounded-lg hover:bg-accent hover:text-secondary transition-colors"
            >
              Evaluación Gratuita
            </Link>
          </div>
        </div>

        <div className="pt-8 mt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-light">
          <p>© {new Date().getFullYear()} Voltac Energy. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#politica-privacidad" className="hover:text-white transition-colors">
              Política de Privacidad (Ley 1581 de 2012)
            </a>
            <a href="#terminos-condiciones" className="hover:text-white transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
