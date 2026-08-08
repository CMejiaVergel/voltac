"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, BarChart3, Eye, Newspaper, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Highly simplified mock auth check for MVP
    const auth = localStorage.getItem("voltac_admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    } else if (pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [pathname, router]);

  if (!isAuthenticated && pathname !== "/admin/login") {
    return <div className="min-h-screen flex items-center justify-center bg-muted text-secondary">Cargando panel de seguridad...</div>;
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20}/>, href: "/admin" },
    { label: "Leads (CRM)", icon: <Users size={20}/>, href: "/admin/leads" },
    { label: "Proyectos", icon: <FolderKanban size={20}/>, href: "/admin/proyectos" },
    { label: "Noticias (Blog)", icon: <Newspaper size={20}/>, href: "/admin/news" },
    { label: "Analytics", icon: <BarChart3 size={20}/>, href: "/admin/analytics" },
    { label: "Preview", icon: <Eye size={20}/>, href: "/admin/preview" },
    { label: "Configuración", icon: <Settings size={20}/>, href: "/admin/configuracion" },
  ];

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
          <button 
            onClick={() => {
              localStorage.removeItem("voltac_admin_auth");
              router.push("/admin/login");
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
