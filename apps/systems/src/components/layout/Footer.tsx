"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Phone } from "lucide-react";
import { CONTACT, SOCIAL, LEGAL_LINKS } from "@/content/services";

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.4 8.5L23.3 22h-6.8l-5.3-6.9L5.1 22H2l7.9-9.1L1.7 2h7l4.8 6.3zm-1.2 18h1.7L7.4 3.7H5.6z"/></svg>
);

const SOCIAL_ITEMS = [
  { href: SOCIAL.linkedin, label: "Perfil de LinkedIn de Voltac Systems", Icon: LinkedinIcon },
  { href: SOCIAL.instagram, label: "Perfil de Instagram de Voltac Systems", Icon: InstagramIcon },
  { href: SOCIAL.facebook, label: "Página de Facebook de Voltac Systems", Icon: FacebookIcon },
  { href: SOCIAL.x, label: "Perfil de X de Voltac Systems", Icon: XIcon },
];

const QUICK_LINKS = [
  { name: "Servicios", href: "/servicios" },
  { name: "Trabajos entregados", href: "/proyectos" },
  { name: "Noticias", href: "/noticias" },
  { name: "Contacto", href: "/cotizar" },
];

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const socials = SOCIAL_ITEMS.filter((s) => s.href);

  return (
    <footer className="bg-secondary text-white/80 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12">
          {/* Marca */}
          <div className="max-w-md space-y-5">
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
              Identificamos las tareas que le están costando horas a su organización y las
              convertimos en procesos que se hacen solos. Tecnología que le devuelve el tiempo a su
              equipo.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3 pt-1">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Enlaces rápidos</h4>
            <ul className="space-y-3 font-light text-white/60">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/cotizar" className="text-accent hover:text-white transition-colors font-semibold">
                  Agendar conversación
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Contacto</h4>
            <ul className="space-y-4 font-light text-white/60">
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <span className="flex flex-col gap-1">
                  <a href={`tel:${CONTACT.phoneHref}`} className="hover:text-accent transition-colors">
                    {CONTACT.phone}
                  </a>
                  <a
                    href={CONTACT.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-white transition-colors font-semibold"
                  >
                    Escribir por WhatsApp
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="flex flex-col gap-1">
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-accent transition-colors">
                    {CONTACT.email}
                  </a>
                  <a href={`mailto:${CONTACT.devEmail}`} className="hover:text-accent transition-colors">
                    {CONTACT.devEmail}
                  </a>
                </span>
              </li>
            </ul>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Ubicación</h4>
            <a
              href={CONTACT.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-white/10 hover:border-primary/40 transition-colors group"
              aria-label={`Ver ubicación de ${CONTACT.legalName} en Google Maps`}
            >
              <iframe
                src={CONTACT.mapsEmbed}
                title={`Ubicación de ${CONTACT.legalName} en ${CONTACT.address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[150px] border-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ filter: "invert(0.92) hue-rotate(180deg) grayscale(0.35) contrast(0.9)" }}
              />
            </a>
            <p className="flex items-start gap-3 font-light text-white/60">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <span>
                {CONTACT.address}
                <br />
                <span className="text-white/40">Servicios en Cartagena y el resto del país.</span>
              </span>
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-light">
          <p>
            © {new Date().getFullYear()} {CONTACT.legalName} · NIT {CONTACT.nit}. Todos los derechos
            reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
