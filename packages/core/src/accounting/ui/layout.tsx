"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "../../utils";
import { useSesion } from "../../sesion-cliente";
import { ROL_ETIQUETA, puedeAcceder, type Rol } from "../../roles";
import { LayoutDashboard, ArrowLeftRight, FileText, FileSignature, Users, Calendar, BarChart, Settings } from "lucide-react";

/**
 * El rol venia de `localStorage.getItem("voltac_admin_role") || "SuperAdmin"`.
 * Era el mismo error que ya habiamos sacado del login: un dato que decide que
 * se muestra, guardado donde el propio navegador puede reescribirlo desde la
 * consola. Ahora llega del token de sesion firmado en el servidor.
 */
export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sesion = useSesion();
  const rol: Rol | null = sesion?.rol ?? null;

  const navItems: { label: string; href: string; icon: React.ReactNode; exact?: boolean }[] = [
    { label: "Resumen",   href: "/admin/accounting",                     icon: <LayoutDashboard size={18} />, exact: true },
    { label: "Dashboard", href: "/admin/accounting/dashboard",            icon: <BarChart size={18} /> },
    { label: "Ingresos & Egresos", href: "/admin/accounting/ingresos-egresos", icon: <ArrowLeftRight size={18} /> },
    { label: "Facturación", href: "/admin/accounting/facturacion",        icon: <FileText size={18} /> },
    { label: "Cotizaciones", href: "/admin/accounting/cotizaciones",      icon: <FileSignature size={18} /> },
    { label: "Clientes & Proveedores", href: "/admin/accounting/clientes-proveedores", icon: <Users size={18} /> },
    { label: "Calendario", href: "/admin/accounting/calendario",          icon: <Calendar size={18} /> },
    { label: "Reportes",   href: "/admin/accounting/reportes",            icon: <BarChart size={18} /> },
    { label: "Configuración", href: "/admin/accounting/configuracion",    icon: <Settings size={18} /> },
  ];

  if (!rol) return <div>Cargando módulo contable...</div>;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary" style={{ fontFamily: "Akira Expanded, sans-serif" }}>ACCOUNTING</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestión financiera y contable de Voltac Systems</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full border border-border">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Rol:</span>
          <span className="text-sm font-bold text-primary">{ROL_ETIQUETA[rol]}</span>
        </div>
      </div>

      <div className="border-b border-border pt-2">
        <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-[1px]">
          {navItems.map((item) => {
            // Mismo mapa que aplica el proxy: una sola lista que revisar.
            if (!puedeAcceder(rol, item.href)) return null;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors relative",
                  isActive ? "text-primary bg-card border-x border-t border-border -mb-[1px]" : "text-muted-foreground hover:bg-secondary/5 hover:text-foreground border border-transparent"
                )}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-[2px] left-0 w-full h-[3px] bg-card z-10" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
