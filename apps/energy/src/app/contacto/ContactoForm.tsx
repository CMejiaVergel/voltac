"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ContactoForm() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const accept = formData.get("accept") as string;

    if (!accept) {
      setErrorMsg("Debe aceptar la Política de Tratamiento de Datos.");
      setLoading(false);
      return;
    }

    try {
      formData.append("modality", "contacto");
      formData.append("source", "Web Contacto");
      formData.append("objective", formData.get("asunto") as string);
      
      const response = await fetch("/api/quote", {
        method: "POST",
        body: formData
      });

      const json = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(json.error || "Ocurrió un error al enviar el formulario.");
      }
    } catch (e: any) {
      setErrorMsg("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-2xl font-black">¡Mensaje Enviado!</h3>
        <p>Nuestro equipo revisará tu solicitud y te contactaremos en breve.</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errorMsg && <div className="text-red-400 font-bold mb-4 text-sm bg-red-400/10 p-3 rounded">{errorMsg}</div>}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wider uppercase text-white/50">Nombre Completo</label>
          <input required name="fullName" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Tu nombre" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wider uppercase text-white/50">Correo Electrónico</label>
          <input required name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="tu@empresa.com" />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wider uppercase text-white/50">Teléfono / Celular</label>
          <input required name="phone" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Ej. 300 000 0000" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wider uppercase text-white/50">Asunto</label>
          <select required name="asunto" className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none" defaultValue="">
            <option value="" disabled>Selecciona el motivo...</option>
            <option value="Dudas sobre garantías">Dudas sobre garantías</option>
            <option value="Mantenimiento (O&M)">Mantenimiento (O&M)</option>
            <option value="Alianzas corporativas">Alianzas corporativas</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold tracking-wider uppercase text-white/50">Mensaje</label>
        <textarea required name="message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" placeholder="Escribe tu consulta aquí..." />
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-4 cursor-pointer mb-8">
          <input required name="accept" type="checkbox" className="mt-1 w-5 h-5 rounded border-white/20 bg-transparent text-primary focus:ring-primary/20 accent-primary" />
          <span className="text-xs text-white/40 leading-relaxed font-light block mt-1">
            Declaro que he leído y acepto los <a href="#terminos-condiciones" className="underline hover:text-white">Términos y Condiciones</a>, y autorizo explícitamente el tratamiento de mis datos personales y envíos comerciales de acuerdo con la <a href="#politica-privacidad" className="underline hover:text-white">Política de Privacidad (Ley 1581 de 2012)</a>.
          </span>
        </label>
        
        <Button disabled={loading} type="submit" variant="accent" size="lg" className="h-14 w-full text-secondary text-base uppercase font-bold tracking-widest disabled:opacity-50">
          {loading ? "Enviando..." : "Enviar Consulta"}
        </Button>
      </div>
    </form>
  );
}
