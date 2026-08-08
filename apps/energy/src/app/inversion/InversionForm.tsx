"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function InversionForm() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const area = formData.get("area") as string;
    const location = formData.get("location") as string;
    const accept = formData.get("accept") as string;

    if (!accept) {
      setErrorMsg("Debes aceptar la Política de Tratamiento de Datos.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("modality", "investment");
      fd.append("fullName", fullName);
      fd.append("phone", phone);
      fd.append("location", location);
      fd.append("message", `Área de Inversión: ${area} hectáreas`);

      const response = await fetch("/api/quote", {
        method: "POST",
        body: fd
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
        <h3 className="text-2xl font-black">¡Solicitud Enviada!</h3>
        <p>Un ingeniero experto en estructuración de granjas solares se pondrá en contacto pronto.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {errorMsg && <div className="text-red-500 font-bold mb-4 text-sm text-center">{errorMsg}</div>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Nombre Completo</label>
          <input required name="fullName" type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Ej. Juan Pérez" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Celular / WhatsApp</label>
          <input required name="phone" type="tel" className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="300 000 0000" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Área del Lote (Hectáreas)</label>
          <input required name="area" type="number" step="any" className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Ej. 1.5" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Ubicación (Municipio)</label>
          <input required name="location" type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Ej. Turbaco, Bolívar" />
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-xs text-secondary/60 cursor-pointer max-w-sm">
          <input required name="accept" type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary" />
          <span>Acepto la Política de Tratamiento de Datos (Ley 1581/2012) para que Voltac me contacte.</span>
        </label>
        <Button disabled={loading} type="submit" variant="default" size="lg" className="w-full sm:w-auto h-12 uppercase disabled:opacity-50">
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </Button>
      </div>
    </form>
  );
}
