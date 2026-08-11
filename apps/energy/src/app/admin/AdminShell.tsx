"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, BarChart3, Eye, Newspaper, Menu, X , Calculator, ShieldCheck, CalendarDays, Bot, SunMedium } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSesion } from "@voltac/core/sesion-cliente";
import { ROL_ETIQUETA, puedeAcceder } from "@voltac/core/roles";
import { logout } from "./login/actions";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sesion = useSesion();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  /* Sin comprobacion de sesion aqui: el proxy decide en el servidor antes de
     que esta pagina se renderice. Comprobarlo tambien en el cliente daba una
     falsa sensacion de proteccion —bastaba escribir la clave en localStorage—. */

  /* Pantallas que se sirven SIN el panel alrededor.
     - El login, porque todavia no hay sesion que enmarcar.
     - El retorno de Google, porque se abre en una pestana aparte y su unico
       cometido es decir si quedo o no: rodearlo del menu completo invita a
       seguir trabajando en una pestana que hay que cerrar. */
  if (pathname === "/admin/login" || pathname === "/admin/ia-assistant/google") {
    return <>{children}</>;
  }

  /* La navegacion se filtra con el mismo mapa que aplica el proxy, asi que un
     enlace visible siempre lleva a algo alcanzable. Ocultar aqui es comodidad,
     no seguridad: quien decide es el servidor. */
  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20}/>, href: "/admin" },
    { label: "Leads (CRM)", icon: <Users size={20}/>, href: "/admin/leads" },
    { label: "IA Assistant", icon: <Bot size={20}/>, href: "/admin/ia-assistant" },
    /* Solo existe en Energy. Systems no tiene esta entrada ni esta ruta. */
    { label: "Dimensionamiento", icon: <SunMedium size={20}/>, href: "/admin/dimensionamiento" },
    { label: "Proyectos", icon: <FolderKanban size={20}/>, href: "/admin/proyectos" },
    { label: "Noticias (Blog)", icon: <Newspaper size={20}/>, href: "/admin/news" },
    { label: "Contenido", icon: <CalendarDays size={20}/>, href: "/admin/contenido" },
    { label: "Analytics", icon: <BarChart3 size={20}/>, href: "/admin/analytics" },
    { label: "Accounting", icon: <Calculator size={20}/>, href: "/admin/accounting" },
    { label: "Preview", icon: <Eye size={20}/>, href: "/admin/preview" },
    { label: "Usuarios", icon: <ShieldCheck size={20}/>, href: "/admin/usuarios" },
    { label: "Configuración", icon: <Settings size={20}/>, href: "/admin/configuracion" },
  ].filter((item) => !sesion || puedeAcceder(sesion.rol, item.href));

  return (
    <div className="h-screen bg-muted/50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-secondary text-white p-4 flex items-center justify-between shrink-0 z-50 shadow-md">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo_horizontal_fondo_oscuro.png" alt="Voltac Admin" width={120} height={30} className="w-auto h-6 object-contain" priority />
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white">
           {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-secondary text-white shrink-0 flex flex-col transition-all duration-300 z-50 h-full",
        "fixed md:relative top-0 bottom-0 left-0",
        mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center min-h-[88px]">
          {!collapsed ? (
            <Link href="/admin" className="block w-full">
              <Image src="/logo_horizontal_fondo_oscuro.png" alt="Voltac Admin" width={150} height={40} className="w-auto h-8 object-contain" priority />
              <span className="text-primary block text-[10px] tracking-[0.2em] font-bold mt-2" style={{ fontFamily: "Akira Expanded, sans-serif" }}>ADMIN PANEL</span>
            </Link>
          ) : (
            <Link href="/admin" className="block mx-auto">
              <Image src="/isotipo_fondo_oscuro.png" alt="Voltac" width={40} height={40} className="w-8 h-8 object-contain" priority />
            </Link>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (pathname === item.href) {
                  e.preventDefault();
                  setCollapsed(!collapsed);
                }
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl transition-colors font-medium text-sm",
                collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                pathname === item.href ? "bg-primary text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          {sesion && !collapsed && (
            <div className="px-4 pb-2">
              <p className="text-sm font-semibold text-white truncate">{sesion.usuario}</p>
              <p className="text-[11px] text-white/50">{ROL_ETIQUETA[sesion.rol]}</p>
            </div>
          )}
          <button
            onClick={() => {
              void logout().then(() => router.replace("/admin/login"));
            }}
            title={collapsed ? "Cerrar Sesión" : undefined}
            className={cn(
              "flex items-center text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-medium text-sm w-full",
              collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            )}
          >
            <LogOut size={20}/>
            {!collapsed && "Cerrar Sesión"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto w-full">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
