import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { CONTACT } from "@/content/services";

export const metadata: Metadata = {
  alternates: { canonical: '/terminos-y-condiciones' },
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso del sitio web de Voltac Systems S.A.S.: alcance de la información publicada, propiedad intelectual, uso de formularios y ley aplicable.",
  robots: { index: true, follow: true },
};

export default function TerminosCondicionesPage() {
  return (
    <LegalPage
      title="Términos y condiciones de uso"
      intro="Estas condiciones regulan el acceso y uso del sitio web de Voltac Systems S.A.S. Al navegar en él, usted acepta lo aquí descrito."
    >
      <LegalSection title="1. Identificación y objeto">
        <p>
          Este sitio es operado por <strong>{CONTACT.legalName}</strong>, NIT {CONTACT.nit}, con
          presencia en {CONTACT.cities}, Colombia. Su objeto es dar a conocer los servicios de la
          compañía y habilitar un canal de contacto comercial.
        </p>
      </LegalSection>

      <LegalSection title="2. Aceptación">
        <p>
          El acceso y uso del sitio implica la aceptación plena de estos términos. Si no está de
          acuerdo con ellos, le pedimos abstenerse de usar el sitio.
        </p>
      </LegalSection>

      <LegalSection title="3. Alcance de la información publicada">
        <p>
          Las descripciones de servicios, tiempos, paquetes de arranque y ejemplos publicados tienen
          carácter <strong>informativo</strong> y no constituyen una oferta comercial vinculante. El
          alcance, los entregables, los plazos y los precios de cualquier proyecto se definen
          únicamente en la propuesta comercial y el contrato suscritos entre las partes. Los tiempos
          indicados son estimaciones basadas en proyectos anteriores y dependen de las condiciones
          particulares de cada organización.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso del sitio">
        <p>Usted se compromete a usar el sitio conforme a la ley y a no:</p>
        <ul>
          <li>Intentar acceder a áreas restringidas, cuentas o sistemas sin autorización.</li>
          <li>Introducir código malicioso o afectar el funcionamiento del sitio.</li>
          <li>Extraer contenido de forma automatizada con fines comerciales sin autorización previa.</li>
          <li>Suplantar la identidad de terceros al diligenciar los formularios.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Formularios y veracidad de la información">
        <p>
          La información que registre en los formularios debe ser veraz y encontrarse actualizada.
          Usted es responsable de los datos que suministra y de contar con autorización cuando
          incluya información de terceros. El tratamiento de esos datos se rige por nuestra{" "}
          <Link href="/politica-de-privacidad" className="text-primary hover:text-accent font-semibold">
            Política de Privacidad
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Propiedad intelectual">
        <p>
          Los textos, el diseño, el logotipo, la marca, las imágenes y el código de este sitio son
          propiedad de {CONTACT.legalName} o se usan con autorización de sus titulares. Las marcas
          de terceros que aparezcan en el sitio pertenecen a sus respectivos propietarios y su
          presencia no implica, por sí sola, vínculo, patrocinio o certificación alguna. Está
          prohibida su reproducción o uso comercial sin autorización escrita previa.
        </p>
      </LegalSection>

      <LegalSection title="7. Enlaces a sitios de terceros">
        <p>
          El sitio puede contener enlaces a páginas de terceros. No controlamos su contenido ni sus
          políticas, por lo que no asumimos responsabilidad por ellos. Le recomendamos revisar sus
          condiciones antes de usarlos.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidad y limitación de responsabilidad">
        <p>
          Procuramos que el sitio esté disponible de forma continua, pero puede haber interrupciones
          por mantenimiento, fallas técnicas o causas ajenas a nuestro control. En la medida
          permitida por la ley, {CONTACT.legalName} no responde por perjuicios derivados de la
          imposibilidad de acceder al sitio ni de decisiones tomadas únicamente con base en la
          información aquí publicada, sin una asesoría particular de por medio.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificaciones">
        <p>
          Podemos actualizar estos términos y el contenido del sitio en cualquier momento. La
          versión vigente será siempre la publicada en esta dirección, con su fecha de última
          actualización.
        </p>
      </LegalSection>

      <LegalSection title="10. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia
          se someterá a los jueces y tribunales competentes de Colombia.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          Para cualquier inquietud sobre estos términos, escríbanos a{" "}
          <strong>{CONTACT.email}</strong> o llámenos al {CONTACT.phone}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
