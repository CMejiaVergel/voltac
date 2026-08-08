"use client";

import { Link2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const WhatsappIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 12.5C21.5 17.7467 17.2467 22 12 22C10.222 22 8.5583 21.5117 7.15175 20.6725L2.5 22L3.82753 17.3482C2.98826 15.9417 2.5 14.278 2.5 12.5C2.5 7.25329 6.75329 3 12 3C17.2467 3 21.5 7.25329 21.5 12.5Z"/></svg>
);

export function ShareButtons({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://energy.voltac.com.co/noticias/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 mt-8 pt-8 border-t border-border">
      <span className="text-sm font-bold uppercase tracking-widest text-secondary/60 mr-2">Visítanos:</span>
      <a href="https://www.instagram.com/voltacenergy/" target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors text-primary" title="Instagram">
        <InstagramIcon />
      </a>
      <a href="https://www.linkedin.com/company/voltac-energy" target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors text-primary" title="LinkedIn">
        <LinkedinIcon />
      </a>
      <a href="https://wa.me/+573136253584" target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors text-primary" title="WhatsApp">
        <WhatsappIcon />
      </a>
      
      <div className="w-px h-6 bg-border mx-2"></div>

      <button onClick={handleCopy} className="p-2 bg-muted rounded-full hover:bg-primary/20 hover:text-primary transition-colors text-secondary/70 flex items-center gap-2 px-4" title="Copiar enlace">
        {copied ? (
           <><CheckCircle2 size={16} className="text-green-600" /> <span className="text-xs font-bold text-green-600">Copiado</span></>
        ) : (
           <><Link2 size={16} /> <span className="text-xs font-bold">Copiar URL</span></>
        )}
      </button>
    </div>
  );
}
