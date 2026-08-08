"use client";

import * as React from "react";
import { X } from "lucide-react";

export function LegalModals() {
  const [activeModal, setActiveModal] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#politica-privacidad" || hash === "#terminos-condiciones") {
        setActiveModal(hash);
      } else {
        setActiveModal(null);
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!activeModal) return null;

  const closeModal = (e: React.MouseEvent) => {
    e.preventDefault();
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm px-6">
      <div className="bg-white rounded-3xl p-8 md:p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-border">
        <button 
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 bg-muted text-secondary/60 hover:text-secondary hover:bg-border rounded-full transition-colors focus:outline-none"
        >
          <X size={24} />
        </button>
        
        {activeModal === "#politica-privacidad" && (
          <div className="space-y-6 text-secondary/80 text-sm md:text-base leading-relaxed">
            <h2 className="text-3xl font-black text-secondary mb-8 tracking-tight">Política de Privacidad Integral</h2>
            <p><strong>De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.</strong></p>
            <p>Voltac Energy recolecta, almacena, usa y trata los datos personales proporcionados por nuestros clientes y usuarios con la finalidad exclusiva de brindar servicios profesionales de ingeniería, consultorías preliminares y cotizaciones técnicas, así como el envío intermitente de información técnica, comercial, ofertas exclusivas o publicidad relacionada con nuestros servicios solares.</p>
            <p>Usted, como titular de los datos, tiene derecho a conocer, actualizar y rectificar permanentemente su información personal, así como a solicitar la eliminación irreversible de nuestro sistema en cualquier momento comunicándose con nosotros vía correo a info@voltac.com.co.</p>
            <p>Conservaremos sus datos bajo estrictas medidas de seguridad informática, previniendo su desvío, alteración o acceso no autorizado. Voltac Energy no comercializa datos de sus usuarios con entidades de terceros ajenos a la prestación integral de nuestros servicios, asegurando mantenernos siempre dentro de un marco de absoluta ética y legalidad.</p>
          </div>
        )}

        {activeModal === "#terminos-condiciones" && (
          <div className="space-y-6 text-secondary/80 text-sm md:text-base leading-relaxed">
            <h2 className="text-3xl font-black text-secondary mb-8 tracking-tight">Términos y Condiciones</h2>
            <p>Al acceder, navegar o proveer sus datos en este sitio web, usted acepta expresamente los siguientes términos y nos otorga la autorización explícita e irrevocable para el tratamiento de su información según se describe a continuación.</p>
            
            <h3 className="text-xl font-bold text-secondary border-b border-border pb-2 pt-6">Autorización Amplia de Uso de Datos</h3>
            <p>Usted acepta otorgar a Voltac Energy los derechos y permisos necesarios para utilizar la información recopilada a través del envío voluntario de nuestros formularios con el propósito inequívoco de: enviarle correspondencia y propuestas de precios, contactarlo a través de medios digitales convencionales (llamadas telefónicas automatizadas o personales, WhatsApp y correos masivos o directos), remitirle material publicitario, estrategias de mercadeo, encuestas de calidad, e informarle plenamente de nuestros nuevos productos, innovaciones o promociones.</p>
            <p>Asimismo, usted nos concede autorización para compartir su perfil u originar enlaces informativos con otras filiales o subsidiarias legales del grupo empresarial Voltac Systems bajo las cuales este permiso esté bajo la misma tutela comercial.</p>
            
            <h3 className="text-xl font-bold text-secondary border-b border-border pb-2 pt-6">Precisión de las Cotizaciones</h3>
            <p>Todas las estimaciones de ahorros financieros, dimensionamientos preliminares o precios arrojados a través de herramientas automáticas web son exclusivos de <strong>carácter referencial</strong> y de orientación general. Estos no constituyen, en ninguna circunstancia, un presupuesto definitivo o vinculante. Toda oferta y cierre contractual en firme queda supeditada a una rigurosa visita técnica y estudio de factibilidad que elaborará nuestro equipo de ingenieros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
