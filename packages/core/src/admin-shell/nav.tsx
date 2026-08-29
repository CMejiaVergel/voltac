import * as React from "react";
import {
  BarChart3,
  Bot,
  Calculator,
  CalendarDays,
  Eye,
  FolderKanban,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldCheck,
  SunMedium,
  Users,
} from "lucide-react";
import type { Marca } from "../roles";

/**
 * El mapa de secciones del panel, en un solo sitio.
 *
 * Estaba duplicado en las dos aplicaciones y la unica diferencia real era una
 * entrada —Dimensionamiento, que solo existe en Energy—. Con dos copias, cada
 * seccion nueva habia que anadirla dos veces, y el dia que se olvidara una las
 * marcas empezarian a divergir sin que nadie lo notara.
 *
 * El orden importa mas de lo que parece: en movil la barra inferior toma los
 * PRIMEROS cuatro elementos a los que la persona alcanza segun su rol, asi que
 * lo que este arriba es lo que queda a un pulgar de distancia. Por eso van
 * primero las tres pantallas donde de verdad se trabaja a diario —tablero,
 * prospectos y asistente— y despues el resto.
 */

export interface ItemNav {
  label: string;
  /** Etiqueta corta para la barra inferior, donde no caben dos palabras. */
  corto: string;
  href: string;
  icono: React.ReactNode;
}

/** El tamano de icono cambia entre la barra lateral y la inferior. */
const ico = (Icono: React.ComponentType<{ size?: number }>, size = 20) => <Icono size={size} />;

export function itemsNav(marca: Extract<Marca, "systems" | "energy">, size = 20): ItemNav[] {
  const items: ItemNav[] = [
    { label: "Dashboard", corto: "Inicio", href: "/admin", icono: ico(LayoutDashboard, size) },
    { label: "Leads (CRM)", corto: "Leads", href: "/admin/leads", icono: ico(Users, size) },
    { label: "IA Assistant", corto: "Asistente", href: "/admin/ia-assistant", icono: ico(Bot, size) },
  ];

  /* Solo en Energy, y va aqui arriba a proposito: es la herramienta con la que
     se le responde a un prospecto cuanto cuesta, asi que se usa tanto como el
     propio CRM. */
  if (marca === "energy") {
    items.push({
      label: "Dimensionamiento",
      corto: "Calcular",
      href: "/admin/dimensionamiento",
      icono: ico(SunMedium, size),
    });
  }

  items.push(
    { label: "Accounting", corto: "Contable", href: "/admin/accounting", icono: ico(Calculator, size) },
    { label: "Proyectos", corto: "Proyectos", href: "/admin/proyectos", icono: ico(FolderKanban, size) },
    { label: "Noticias (Blog)", corto: "Noticias", href: "/admin/news", icono: ico(Newspaper, size) },
    { label: "Contenido", corto: "Contenido", href: "/admin/contenido", icono: ico(CalendarDays, size) },
    { label: "Analytics", corto: "Métricas", href: "/admin/analytics", icono: ico(BarChart3, size) },
    { label: "Preview", corto: "Preview", href: "/admin/preview", icono: ico(Eye, size) },
    { label: "Usuarios", corto: "Usuarios", href: "/admin/usuarios", icono: ico(ShieldCheck, size) },
    { label: "Configuración", corto: "Ajustes", href: "/admin/configuracion", icono: ico(Settings, size) },
  );

  return items;
}

/**
 * Que seccion corresponde a una ruta.
 *
 * Se busca el prefijo mas largo y no una coincidencia exacta, porque
 * `/admin/leads/algo` sigue siendo Leads. `/admin` se trata aparte: como
 * prefijo alcanza a todo, y sin esa excepcion cualquier ruta se marcaria
 * tambien como el tablero.
 */
export function seccionActiva(items: ItemNav[], pathname: string): ItemNav | undefined {
  let mejor: ItemNav | undefined;
  for (const item of items) {
    const coincide = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    if (!coincide) continue;
    if (!mejor || item.href.length > mejor.href.length) mejor = item;
  }
  return mejor;
}
