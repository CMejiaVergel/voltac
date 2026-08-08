import * as React from "react";
import { LEGAL_UPDATED } from "@/content/services";

/**
 * Contenedor compartido de las páginas legales (privacidad, términos).
 * Mantiene la misma cabecera oscura del resto del sitio y una columna de
 * lectura angosta para textos largos.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-white text-secondary">
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="display-3 md:text-4xl mb-4">{title}</h1>
          <p className="lead text-white/70">{intro}</p>
          <p className="text-xs uppercase tracking-widest text-white/40 mt-6">
            Última actualización: {LEGAL_UPDATED}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-10">{children}</div>
      </section>
    </div>
  );
}

/** Sección numerada dentro de un documento legal. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
      <div className="space-y-4 text-secondary/70 font-light leading-relaxed [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_strong]:font-semibold [&_strong]:text-secondary">
        {children}
      </div>
    </section>
  );
}
