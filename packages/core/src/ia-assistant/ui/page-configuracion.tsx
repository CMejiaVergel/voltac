import * as React from "react";
import { asistenteDisponible } from "../cliente";
import { verticalConfig } from "../../vertical";
import IaAssistantLayout from "./layout";
import Configuracion from "./Configuracion";

export default function IaAssistantConfiguracionPage() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Configuracion disponible={disponible} />
    </IaAssistantLayout>
  );
}
