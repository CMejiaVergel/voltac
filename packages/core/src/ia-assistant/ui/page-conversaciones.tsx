import * as React from "react";
import { asistenteDisponible } from "../cliente";
import { verticalConfig } from "../../vertical";
import IaAssistantLayout from "./layout";
import Bandeja from "./Bandeja";

export default function IaAssistantConversacionesPage() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Bandeja disponible={disponible} />
    </IaAssistantLayout>
  );
}
