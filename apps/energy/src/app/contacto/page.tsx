import * as React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { ContactoForm } from "./ContactoForm";

export const metadata = {
  title: "Contacto | Voltac Energy",
  description: "Comunícate con Voltac Energy para resolver dudas o solicitar una visita técnica fotovoltaica.",
};

export default function ContactoPage() {
  return (
    <div className="pt-24 pb-20 bg-white min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Contact Header */}
        <section className="text-center max-w-2xl mx-auto mb-20 space-y-6">
          <h1 className="text-5xl font-black text-secondary tracking-tight">Hablemos de <span className="text-primary">Energía.</span></h1>
          <p className="text-xl text-secondary/60 font-light max-w-xl mx-auto">Nuestro equipo de ingenieros está listo para acompañarte. Déjanos un mensaje o encuéntranos en Cartagena.</p>
        </section>

        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Info Side */}
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-muted p-10 rounded-3xl space-y-8 border border-border">
              <div>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Información de Contacto</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-primary shadow-sm mt-1 border border-border"><MapPin size={24}/></div>
                    <div>
                      <p className="font-bold text-secondary mb-1">Presencia Nacional</p>
                      <p className="text-secondary/60 font-medium">Sedes: Cartagena, Sincelejo, Barranquilla, Medellín y Montería.</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-primary shadow-sm border border-border"><Phone size={24}/></div>
                    <div>
                      <p className="font-bold text-secondary mb-1">Teléfono Fijo / Móvil</p>
                      <p className="text-secondary/60 font-medium">+57 313 625 3584</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-primary shadow-sm border border-border mt-1"><Mail size={24}/></div>
                    <div>
                      <p className="font-bold text-secondary mb-1">Correos de Contacto</p>
                      <div className="text-secondary/60 font-medium break-all flex flex-col pt-1 gap-1">
                        <span>sales@voltac.com.co</span>
                        <span>projects@voltac.com.co</span>
                        <span>operations@voltac.com.co</span>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-primary shadow-sm border border-border"><Clock size={24}/></div>
                    <div>
                      <p className="font-bold text-secondary mb-1">Atención Administrativa</p>
                      <p className="text-secondary/60 font-medium">Lun-Vie: 8:00 AM - 6:00 PM</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="pt-6 border-t border-border">
                <a href="https://wa.me/573136253584" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-3 bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 font-bold p-4 rounded-2xl transition-colors">
                  <MessageCircle size={24} />
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
             <div className="bg-secondary p-10 md:p-14 rounded-3xl shadow-xl text-white">
               <h2 className="text-3xl font-black tracking-tight mb-2">Envíanos un mensaje</h2>
               <p className="text-white/60 mb-10 font-light">Completa el formulario y responderemos en menos de 24 horas hábiles.</p>
               
               <ContactoForm />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
