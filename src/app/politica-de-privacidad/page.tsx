import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { CONTACT } from "@/content/services";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de tratamiento de datos personales de Voltac Systems S.A.S., conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015.",
  robots: { index: true, follow: true },
};

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPage
      title="Política de tratamiento de datos personales"
      intro="Esta política explica qué datos personales recolectamos a través de este sitio web, para qué los usamos y cómo puede ejercer sus derechos como titular, conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y demás normas colombianas aplicables."
    >
      <LegalSection title="1. Responsable del tratamiento">
        <p>
          <strong>{CONTACT.legalName}</strong>, identificada con NIT {CONTACT.nit}, sociedad
          domiciliada en Colombia, con presencia en {CONTACT.cities}, es la responsable del
          tratamiento de los datos personales recolectados a través de {CONTACT.site}.
        </p>
        <p>
          Canal de atención al titular: <strong>{CONTACT.privacyEmail}</strong> · {CONTACT.phone}
        </p>
      </LegalSection>

      <LegalSection title="2. Datos que recolectamos">
        <p>Recolectamos únicamente los datos que usted nos entrega de forma voluntaria y los que genera su navegación:</p>
        <ul>
          <li>
            <strong>Datos de contacto comercial</strong>, cuando diligencia el formulario de
            contacto: nombre completo, empresa u oficina, correo electrónico, teléfono o WhatsApp,
            servicio de interés, rango de inversión considerado y la descripción de la necesidad que
            nos comparte.
          </li>
          <li>
            <strong>Datos de navegación</strong>: dirección IP, tipo de dispositivo y navegador,
            páginas visitadas y origen de la visita, recolectados con fines estadísticos.
          </li>
        </ul>
        <p>
          No solicitamos datos sensibles ni datos de menores de edad a través de este sitio. Le
          pedimos no incluir información confidencial de terceros, historias clínicas, credenciales
          de acceso ni datos financieros en el campo de descripción del formulario.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalidades del tratamiento">
        <ul>
          <li>Atender su solicitud y contactarlo para agendar una conversación de diagnóstico.</li>
          <li>Elaborar y remitir propuestas comerciales y cotizaciones.</li>
          <li>Gestionar la relación comercial y contractual, incluida la facturación cuando aplique.</li>
          <li>Enviar información sobre nuestros servicios, siempre que usted lo haya autorizado.</li>
          <li>Medir el desempeño del sitio y mejorar la experiencia de navegación.</li>
          <li>Cumplir obligaciones legales, contables y tributarias.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Autorización del titular">
        <p>
          Al enviar el formulario de contacto usted autoriza de manera previa, expresa e informada a{" "}
          {CONTACT.legalName} para tratar sus datos personales con las finalidades descritas en esta
          política. Esa autorización es voluntaria y puede revocarla en cualquier momento por los
          canales indicados, salvo cuando exista un deber legal o contractual que exija conservar la
          información.
        </p>
      </LegalSection>

      <LegalSection title="5. Derechos del titular">
        <p>Como titular de los datos, usted tiene derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
          <li>
            Revocar la autorización y solicitar la supresión de sus datos, cuando no exista un deber
            legal o contractual que lo impida.
          </li>
          <li>Acceder de forma gratuita a sus datos personales.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la
            normativa de protección de datos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cómo ejercer sus derechos">
        <p>
          Envíe su consulta o reclamo a <strong>{CONTACT.privacyEmail}</strong> indicando su nombre,
          los datos de contacto para responderle y la descripción de su solicitud. Atendemos las{" "}
          <strong>consultas dentro de los diez (10) días hábiles</strong> siguientes a su recibo y
          los <strong>reclamos dentro de los quince (15) días hábiles</strong> siguientes, en los
          términos de los artículos 14 y 15 de la Ley 1581 de 2012. Si no es posible responder
          dentro de esos plazos, le informaremos los motivos y la fecha en que se atenderá su
          solicitud.
        </p>
      </LegalSection>

      <LegalSection title="7. Conservación de la información">
        <p>
          Conservamos sus datos mientras dure la relación comercial y, después de terminada, durante
          el tiempo necesario para atender obligaciones legales, contables y tributarias, o para
          atender eventuales reclamaciones. Cumplido ese término, los datos se suprimen o se
          anonimizan.
        </p>
      </LegalSection>

      <LegalSection title="8. Encargados y terceros">
        <p>
          Para operar el sitio y nuestra gestión comercial usamos proveedores de infraestructura
          tecnológica, alojamiento, correo electrónico y analítica, que actúan como encargados del
          tratamiento y solo pueden usar los datos siguiendo nuestras instrucciones. No vendemos ni
          cedemos sus datos personales a terceros con fines publicitarios.
        </p>
      </LegalSection>

      <LegalSection title="9. Seguridad de la información">
        <p>
          Aplicamos medidas técnicas, humanas y administrativas razonables para proteger los datos
          contra pérdida, acceso no autorizado, alteración o divulgación: control de accesos por
          perfiles, cifrado en tránsito, registros de auditoría y respaldos periódicos.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies y contenido de terceros">
        <p>
          Este sitio puede usar cookies propias y de terceros con fines de funcionamiento y de
          medición estadística de tráfico.
        </p>
        <p>
          <strong>Mapa de ubicación.</strong> El pie de página incorpora un mapa provisto por{" "}
          <strong>Google Maps</strong> (Google LLC). Al cargarse, ese contenido embebido puede
          instalar cookies de Google en su navegador y transmitir a esa compañía datos técnicos como
          su dirección IP, el tipo de dispositivo y la página desde la que se cargó el mapa, incluso
          si usted no interactúa con él. Ese tratamiento lo realiza Google como responsable
          independiente y se rige por sus propias políticas, no por esta. Puede consultarlas en la{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-accent font-semibold"
          >
            Política de Privacidad de Google
          </a>
          . El mapa cumple una finalidad meramente informativa: mostrar dónde estamos ubicados.
        </p>
        <p>
          Si prefiere evitarlo, puede bloquear las cookies de terceros o el contenido embebido desde
          la configuración de su navegador, o consultar nuestra ubicación directamente en Google
          Maps. Bloquear cookies puede hacer que algunas funciones del sitio dejen de operar con
          normalidad; el resto del sitio seguirá funcionando sin el mapa.
        </p>
      </LegalSection>

      <LegalSection title="11. Vigencia y cambios">
        <p>
          Esta política rige desde su fecha de publicación y puede actualizarse cuando cambien
          nuestras prácticas o la normativa aplicable. Publicaremos la versión vigente en esta misma
          dirección, indicando la fecha de última actualización. Consulte también nuestros{" "}
          <Link href="/terminos-y-condiciones" className="text-primary hover:text-accent font-semibold">
            Términos y Condiciones
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
