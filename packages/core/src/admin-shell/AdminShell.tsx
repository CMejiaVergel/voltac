"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LogOut, MoreHorizontal, X } from "lucide-react";
import { ROL_ETIQUETA, puedeAcceder, type Marca } from "../roles";
import { useSesion } from "../sesion-cliente";
import { itemsNav, seccionActiva, type ItemNav } from "./nav";

/**
 * El armazon del panel, con dos formas segun el dispositivo.
 *
 * En escritorio es lo de siempre: barra lateral plegable. En movil deja de ser
 * una web con menu hamburguesa y pasa a comportarse como una aplicacion: barra
 * inferior con las secciones de uso diario, hoja deslizante para el resto,
 * cabecera compacta con el nombre de donde estas.
 *
 * La diferencia no es estetica. En un telefono la parte alta de la pantalla no
 * se alcanza con el pulgar de la mano que sostiene el aparato, y la hamburguesa
 * esconde TODA la navegacion detras de un toque: cambiar de seccion son dos
 * gestos y hay que mirar. Con la barra inferior es uno y a ciegas.
 *
 * Vive en el nucleo y no en cada aplicacion porque estaba duplicado y la unica
 * diferencia real era el logo y una entrada de menu. Ver `nav.tsx`.
 */

export interface LogosMarca {
  /** Logo horizontal sobre fondo oscuro. */
  horizontal: string;
  /** Isotipo cuadrado, para la barra plegada y la cabecera movil. */
  isotipo: string;
}

export interface AdminShellProps {
  marca: Extract<Marca, "systems" | "energy">;
  logos: LogosMarca;
  /** Accion de servidor: la sesion es una cookie httpOnly y solo el servidor la borra. */
  logout: () => Promise<void>;
  children: React.ReactNode;
}

/** Cuantas secciones caben en la barra inferior antes del boton "Mas". */
const CUPO_BARRA = 4;

export function AdminShell({ marca, logos, logout, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sesion = useSesion();
  const [plegada, setPlegada] = React.useState(false);
  const [hoja, setHoja] = React.useState(false);

  /* Al cambiar de seccion la hoja se cierra sola. Sin esto queda abierta sobre
     la pantalla nueva y hay que descartarla a mano, que es justo lo que una
     aplicacion no hace. */
  React.useEffect(() => setHoja(false), [pathname]);

  /* Con la hoja abierta el fondo no debe desplazarse: se siente como si la
     pantalla se hubiera partido en dos capas que se mueven a la vez. */
  React.useEffect(() => {
    if (!hoja) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [hoja]);

  /*
   * Pantallas que se sirven SIN el panel alrededor: el login, porque todavia no
   * hay sesion que enmarcar, y el retorno de Google, que se abre en una pestana
   * aparte y solo dice si quedo o no.
   *
   * El corte va DESPUES de los hooks a proposito: React exige que se llamen
   * siempre en el mismo orden, y salir antes de declararlos rompe la regla en
   * cuanto alguien navega del login al panel.
   */
  if (pathname === "/admin/login" || pathname === "/admin/ia-assistant/google") {
    return <>{children}</>;
  }

  /* Se filtra con el mismo mapa que aplica el proxy, asi que un enlace visible
     siempre lleva a algo alcanzable. Ocultar aqui es comodidad, no seguridad:
     quien decide es el servidor. */
  const items = itemsNav(marca).filter((i) => !sesion || puedeAcceder(sesion.rol, i.href));
  const activa = seccionActiva(items, pathname);

  /* Los primeros del mapa, que son los de uso diario. Como la lista ya viene
     filtrada por rol, cada persona ve en la barra lo que de verdad usa: un
     asesor no tiene tablero, asi que su primera pestana es el asistente. */
  const enBarra = items.slice(0, CUPO_BARRA);
  const enHoja = items.slice(CUPO_BARRA);

  const cerrarSesion = () => {
    void logout().then(() => router.replace("/admin/login"));
  };

  return (
    /* `100dvh` y no `100vh`: en movil la barra del navegador aparece y
       desaparece al desplazarse, y con `vh` la interfaz salta o deja un hueco
       bajo la barra inferior. `dvh` sigue ese movimiento. */
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-muted/50 md:flex-row">
      {/* ---------------------------------------------- cabecera movil */}
      <header
        className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-secondary px-4 pb-3 text-white md:hidden"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {activa && pathname !== activa.href ? (
          /* Volver, cuando se esta en una subpantalla. Es el gesto que la gente
             espera de una app antes que el menu. */
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="-ml-2 rounded-full p-2 text-white/80 transition active:scale-90 active:bg-white/10"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <Link href="/admin" className="shrink-0" aria-label="Inicio">
            <Image src={logos.isotipo} alt="" width={28} height={28} className="h-7 w-7 object-contain" priority />
          </Link>
        )}
        <h1 className="truncate text-base font-semibold">{activa?.label ?? "Panel"}</h1>
      </header>

      {/* ---------------------------------------------- barra lateral */}
      <aside
        className={[
          "z-40 hidden h-full shrink-0 flex-col bg-secondary text-white md:flex",
          "transition-[width] duration-300 ease-out",
          plegada ? "md:w-20" : "md:w-64",
        ].join(" ")}
      >
        <div className="flex min-h-[88px] flex-col items-center justify-center border-b border-white/10 p-6">
          {plegada ? (
            <Link href="/admin" className="mx-auto block">
              <Image src={logos.isotipo} alt="Voltac" width={40} height={40} className="h-8 w-8 object-contain" priority />
            </Link>
          ) : (
            <Link href="/admin" className="block w-full">
              <Image
                src={logos.horizontal}
                alt="Voltac Admin"
                width={150}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
              <span
                className="mt-2 block text-[10px] font-bold tracking-[0.2em] text-primary"
                style={{ fontFamily: "Akira Expanded, sans-serif" }}
              >
                ADMIN PANEL
              </span>
            </Link>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                /* Volver a pulsar la seccion en la que ya estas pliega la barra.
                   Es un atajo del panel anterior y la gente lo usa. */
                if (pathname === item.href) {
                  e.preventDefault();
                  setPlegada(!plegada);
                }
              }}
              title={plegada ? item.label : undefined}
              className={[
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                plegada ? "justify-center p-3" : "gap-3 px-4 py-3",
                activa?.href === item.href ? "bg-primary text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              {item.icono}
              {!plegada && item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          {sesion && !plegada && (
            <div className="px-4 pb-2">
              <p className="truncate text-sm font-semibold text-white">{sesion.usuario}</p>
              <p className="text-[11px] text-white/50">{ROL_ETIQUETA[sesion.rol]}</p>
            </div>
          )}
          <button
            type="button"
            onClick={cerrarSesion}
            title={plegada ? "Cerrar Sesión" : undefined}
            className={[
              "flex w-full items-center rounded-xl text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
              plegada ? "justify-center p-3" : "gap-3 px-4 py-3",
            ].join(" ")}
          >
            <LogOut size={20} />
            {!plegada && "Cerrar Sesión"}
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------- contenido */}
      <main
        /* `overscroll-contain` corta el rebote encadenado: sin el, al llegar al
           final de una lista el gesto arrastra la pagina entera por debajo y en
           iOS parece que la aplicacion se despega. */
        className="w-full flex-1 overflow-y-auto overscroll-contain bg-background"
      >
        <div
          key={pathname}
          /* `pb-barra` deja hueco para que el ultimo elemento no quede bajo la
             barra inferior ni bajo el indicador de inicio del iPhone. Es una
             clase y no un estilo en linea porque en escritorio tiene que poder
             volver al margen normal, y un estilo en linea gana siempre. */
          className="animate-entrada p-4 pb-barra md:p-8"
        >
          {children}
        </div>
      </main>

      {/* ---------------------------------------------- barra inferior */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {enBarra.map((item) => (
          <Pestana key={item.href} item={item} activa={activa?.href === item.href} />
        ))}
        <button
          type="button"
          onClick={() => setHoja(true)}
          aria-label="Más secciones"
          aria-expanded={hoja}
          className={[
            "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition active:scale-90",
            hoja ? "text-primary" : "text-muted-foreground",
          ].join(" ")}
        >
          <MoreHorizontal size={22} />
          Más
        </button>
      </nav>

      {/* ---------------------------------------------- hoja "Mas" */}
      {hoja && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setHoja(false)}
            className="animate-aparecer fixed inset-0 z-50 bg-black/40 md:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="animate-subir fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-background shadow-2xl md:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* El tirador. No hace nada por si mismo: dice "esto se desliza". */}
            <div className="sticky top-0 z-10 flex flex-col items-center bg-background pt-2">
              <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{sesion?.usuario ?? "Panel"}</p>
                {sesion && <p className="text-xs text-muted-foreground">{ROL_ETIQUETA[sesion.rol]}</p>}
              </div>
              <button
                type="button"
                onClick={() => setHoja(false)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-muted-foreground transition active:scale-90 active:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            {enHoja.length > 0 && (
              <div className="grid grid-cols-3 gap-2 px-4 pb-2 pt-1">
                {enHoja.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center text-xs font-medium transition active:scale-95",
                      activa?.href === item.href
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/60 text-foreground active:bg-muted",
                    ].join(" ")}
                  >
                    {item.icono}
                    <span className="leading-tight">{item.corto}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="px-4 pb-2 pt-2">
              <button
                type="button"
                onClick={cerrarSesion}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-4 text-sm font-semibold text-destructive transition active:scale-[.98]"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Pestana({ item, activa }: { item: ItemNav; activa: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={activa ? "page" : undefined}
      className={[
        "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition active:scale-90",
        /* Sin `hover`: en un telefono no existe. Lo que da sensacion de
           respuesta es que el boton ceda al tocarlo. */
        activa ? "text-primary" : "text-muted-foreground",
      ].join(" ")}
    >
      {/* Marca de la pestana activa. Arriba y no debajo del texto: asi no se
          confunde con el indicador de inicio del telefono. */}
      <span
        className={[
          "absolute top-0 h-0.5 w-8 rounded-full transition-opacity duration-200",
          activa ? "bg-primary opacity-100" : "opacity-0",
        ].join(" ")}
      />
      {item.icono}
      <span className="max-w-full truncate px-1">{item.corto}</span>
    </Link>
  );
}
