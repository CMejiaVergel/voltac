"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LogOut, Menu, X } from "lucide-react";
import { ROL_ETIQUETA, puedeAcceder, type Marca } from "../roles";
import { useSesion } from "../sesion-cliente";
import { itemsNav, seccionActiva, type ItemNav } from "./nav";

/**
 * El armazon del panel, con dos formas segun el dispositivo.
 *
 * En escritorio, barra lateral plegable. En movil, la misma barra convertida en
 * cajon: se desliza desde la izquierda sobre el contenido y se cierra al
 * navegar, al tocar fuera o al deslizarla de vuelta.
 *
 * Se probo antes con barra inferior de pestanas. Se descarto por dos razones,
 * y la segunda pesa mas que la primera: un elemento fijo abajo se pelea con el
 * indicador de inicio del iPhone y deja un hueco blanco dificil de cuadrar en
 * modo instalado; y sobre todo, este panel tiene doce secciones. Una barra de
 * pestanas obliga a partirlas en "las cuatro de siempre" y "el resto detras de
 * un boton", y esa division es arbitraria en una herramienta donde el trabajo
 * de hoy puede estar en contabilidad y el de manana en contenido. El cajon las
 * muestra todas de una vez, en el mismo orden que en escritorio.
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

export function AdminShell({ marca, logos, logout, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sesion = useSesion();
  const [plegada, setPlegada] = React.useState(false);
  const [cajon, setCajon] = React.useState(false);

  /* Al cambiar de seccion el cajon se cierra solo. Sin esto queda abierto sobre
     la pantalla nueva y hay que descartarlo a mano, que es justo lo que una
     aplicacion no hace. */
  React.useEffect(() => setCajon(false), [pathname]);

  /* Con el cajon abierto el fondo no debe desplazarse: se siente como si la
     pantalla se hubiera partido en dos capas que se mueven a la vez. */
  React.useEffect(() => {
    if (!cajon) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [cajon]);

  /* Cerrar con la tecla de escape. Cuesta una linea y es lo que espera
     cualquiera que abra esto desde un teclado. */
  React.useEffect(() => {
    if (!cajon) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCajon(false);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [cajon]);

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

  const cerrarSesion = () => {
    void logout().then(() => router.replace("/admin/login"));
  };

  /** La lista de secciones. Se pinta igual en la barra fija y en el cajon. */
  const listaSecciones = (compacta: boolean) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={(e) => {
            /* En escritorio, volver a pulsar la seccion en la que ya estas
               pliega la barra. Es un atajo del panel anterior y la gente lo
               usa. En el cajon no aplica: ahi el toque siempre navega o cierra. */
            if (compacta && pathname === item.href) {
              e.preventDefault();
              setPlegada(!plegada);
            }
          }}
          title={compacta && plegada ? item.label : undefined}
          className={[
            "flex items-center rounded-xl text-sm font-medium transition-colors active:scale-[.98]",
            compacta && plegada ? "justify-center p-3" : "gap-3 px-4 py-3",
            activa?.href === item.href
              ? "bg-primary text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          {item.icono}
          {(!compacta || !plegada) && item.label}
        </Link>
      ))}
    </nav>
  );

  const piePanel = (compacta: boolean) => (
    <div className="space-y-2 border-t border-white/10 p-4">
      {sesion && (!compacta || !plegada) && (
        <div className="px-4 pb-2">
          <p className="truncate text-sm font-semibold text-white">{sesion.usuario}</p>
          <p className="text-[11px] text-white/50">{ROL_ETIQUETA[sesion.rol]}</p>
        </div>
      )}
      <button
        type="button"
        onClick={cerrarSesion}
        title={compacta && plegada ? "Cerrar Sesión" : undefined}
        className={[
          "flex w-full items-center rounded-xl text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-[.98]",
          compacta && plegada ? "justify-center p-3" : "gap-3 px-4 py-3",
        ].join(" ")}
      >
        <LogOut size={20} />
        {(!compacta || !plegada) && "Cerrar Sesión"}
      </button>
    </div>
  );

  return (
    /* `100dvh` y no `100vh`: en movil la barra del navegador aparece y
       desaparece al desplazarse, y con `vh` la interfaz salta o deja un hueco.
       `dvh` sigue ese movimiento. */
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-muted/50 md:flex-row">
      {/* ---------------------------------------------- cabecera movil */}
      <header
        className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-secondary px-2 pb-2 text-white md:hidden"
        /* Sin esto el titulo queda debajo del reloj y la bateria cuando corre
           instalada: en ese modo la pagina empieza en el borde real de la
           pantalla, no bajo la barra de estado. */
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        {activa && pathname !== activa.href ? (
          /* En una subpantalla, volver. Es el gesto que la gente espera de una
             app, y sustituye al menu igual que en cualquier aplicacion nativa:
             el cajon sigue a un toque desde la seccion. */
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="rounded-full p-2.5 text-white/90 transition active:scale-90 active:bg-white/10"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCajon(true)}
            aria-label="Abrir menú"
            aria-expanded={cajon}
            className="rounded-full p-2.5 text-white/90 transition active:scale-90 active:bg-white/10"
          >
            <Menu size={22} />
          </button>
        )}

        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{activa?.label ?? "Panel"}</h1>

        <Link href="/admin" className="shrink-0 pr-1" aria-label="Inicio">
          <Image src={logos.isotipo} alt="" width={26} height={26} className="h-6.5 w-6.5 object-contain" priority />
        </Link>
      </header>

      {/* ---------------------------------------------- barra lateral (escritorio) */}
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
        {listaSecciones(true)}
        {piePanel(true)}
      </aside>

      {/* ---------------------------------------------- cajon (movil) */}
      {cajon && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setCajon(false)}
            className="animate-aparecer fixed inset-0 z-50 bg-black/50 md:hidden"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Secciones"
            className="animate-cajon fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[20rem] flex-col bg-secondary text-white shadow-2xl md:hidden"
          >
            <div
              className="flex items-center justify-between gap-2 border-b border-white/10 px-4 pb-4"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
            >
              <Link href="/admin" className="min-w-0">
                <Image
                  src={logos.horizontal}
                  alt="Voltac Admin"
                  width={150}
                  height={40}
                  className="h-7 w-auto object-contain"
                  priority
                />
                <span
                  className="mt-1.5 block text-[9px] font-bold tracking-[0.2em] text-primary"
                  style={{ fontFamily: "Akira Expanded, sans-serif" }}
                >
                  ADMIN PANEL
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setCajon(false)}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-2 text-white/70 transition active:scale-90 active:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {listaSecciones(false)}

            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{piePanel(false)}</div>
          </aside>
        </>
      )}

      {/* ---------------------------------------------- contenido */}
      <main
        /* `overscroll-contain` corta el rebote encadenado: sin el, al llegar al
           final de una lista el gesto arrastra la pagina entera por debajo y en
           iOS parece que la aplicacion se despega. */
        className="w-full flex-1 overflow-y-auto overscroll-contain bg-background"
      >
        <div key={pathname} className="animate-entrada p-4 pb-barra md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { ItemNav };
