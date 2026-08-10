import * as React from "react";
import { asistenteDisponible } from "../cliente";
import { verticalConfig } from "../../vertical";
import IaAssistantLayout from "./layout";
import Bandeja from "./Bandeja";

/**
 * Página del módulo. La monta cada aplicación con un puente de una línea.
 *
 * Si esta línea de negocio tiene asistente se resuelve **en el servidor**,
 * porque depende del entorno del proceso y no del navegador. De ahí que Energy
 * pueda montar exactamente este mismo código y ver el módulo completo pero
 * inerte, sin ninguna rama de "si es Energy" en ningún sitio: la diferencia
 * está en la configuración, no en el código.
 */
export default function IaAssistantPage() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Bandeja disponible={disponible} />
    </IaAssistantLayout>
  );
}
