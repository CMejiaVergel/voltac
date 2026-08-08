"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    // Check if user already gave consent on this device/browser
    const consented = localStorage.getItem("voltac_cookie_consent");
    if (!consented) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("voltac_cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-sm bg-secondary text-white p-6 rounded-2xl shadow-2xl z-[100] border border-white/10 flex flex-col gap-4 animate-in slide-in-from-bottom-5">
      <div className="space-y-2">
        <h3 className="font-bold tracking-tight text-lg">Cookies & Analítica</h3>
        <p className="text-xs font-light text-white/70 leading-relaxed">
          Utilizamos cookies para personalizar tu experiencia, estructurar publicidad dirigida y analizar el comportamiento de nuestro portal. Al presionar "De acuerdo", autorizas nuestra política legal de manejo de datos de forma pasiva.
        </p>
      </div>
      <div className="flex gap-3 mt-1">
        <Button onClick={handleAccept} variant="accent" className="flex-1 text-secondary font-bold hover:scale-105 transition-transform">
          De acuerdo
        </Button>
      </div>
    </div>
  );
}
