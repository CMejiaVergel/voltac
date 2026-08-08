"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const user = fd.get("username");
    const pass = fd.get("password");

    if (user === "voltacenergy" && pass === "voltacenergy2026") {
      localStorage.setItem("voltac_admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Credenciales incorrectas.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full point-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 blur-[150px] rounded-full point-events-none" />

      <div className="relative z-10 bg-white/5 border border-white/10 p-10 rounded-3xl shadow-2xl backdrop-blur-xl w-full max-w-md text-white">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/20 flex items-center justify-center rounded-2xl border border-primary/30">
             <Lock className="text-primary" size={32} />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black tracking-tight mb-2">Panel de Control</h1>
          <p className="text-white/60 font-light text-sm">Ingresa tus credenciales de superusuario</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-wider text-white/50">Usuario</label>
             <input name="username" type="text" className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors" placeholder="voltacenergy" />
           </div>
           
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-wider text-white/50">Contraseña</label>
             <input name="password" type="password" className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
           </div>

           {error && <p className="text-destructive text-sm font-medium text-center">{error}</p>}

           <div className="pt-4">
             <Button type="submit" variant="accent" size="lg" className="h-12 w-full text-secondary text-sm font-bold tracking-widest uppercase shadow-xl shadow-accent/20">Ingresar</Button>
           </div>
        </form>
      </div>
    </div>
  );
}
