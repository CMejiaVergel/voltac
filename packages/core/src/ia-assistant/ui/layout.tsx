"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Inbox, LayoutDashboard, Settings, Activity } from "lucide-react";
import { cn } from "../../utils";

/**
 * Módulo IA Assistant.
 *
 * Centraliza todo lo del asistente de inteligencia artificial: las
 * conversaciones, cómo se comporta y qué ha estado haciendo. Está pensado para
 * crecer hacia varias redes —Messenger, Instagram— sin cambiar de forma: por eso
 * se llama por lo que es, un asistente, y no por el canal por el que hoy habla.
 *
 * Las pestañas que todavía no existen se muestran igual, deshabilitadas. Ocultar
 * lo que viene obliga a explicar de palabra qué falta; enseñarlo apagado lo dice
 * solo.
 */
export default function IaAssistantLayout({
  children,
  disponible,
  nombreLinea,
}: {
  children: React.ReactNode;
  /** Si esta línea de negocio tiene asistente configurado. */
  disponible: boolean;
  nombreLinea: string;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Conversaciones", href: "/admin/ia-assistant", icon: <Inbox size={18} />, exact: true, listo: true },
    { label: "Panel", href: "/admin/ia-assistant/panel", icon: <LayoutDashboard size={18} />, listo: false },
    { label: "Configuración", href: "/admin/ia-assistant/configuracion", icon: <Settings size={18} />, listo: false },
    { label: "Actividad", href: "/admin/ia-assistant/actividad", icon: <Activity size={18} />, listo: false },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary" style={{ fontFamily: "Akira Expanded, sans-serif" }}>
            IA ASSISTANT
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Asistente de atención automática de {nombreLinea}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold",
            disponible
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-muted border-border text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              disponible ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40",
            )}
          />
          {disponible ? "Línea conectada" : "Sin configurar"}
        </div>
      </div>

      <div className="border-b border-border pt-2">
        <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-[1px]">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            if (!item.listo) {
              return (
                <span
                  key={item.href}
                  title="Todavía no está construido"
                  className="flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap text-muted-foreground/40 cursor-not-allowed border border-transparent"
                >
                  {item.icon}
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors relative",
                  isActive
                    ? "text-primary bg-card border-x border-t border-border -mb-[1px]"
                    : "text-muted-foreground hover:bg-secondary/5 hover:text-foreground border border-transparent",
                )}
              >
                {item.icon}
                {item.label}
                {isActive && <span className="absolute -bottom-[2px] left-0 w-full h-[3px] bg-card z-10" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
