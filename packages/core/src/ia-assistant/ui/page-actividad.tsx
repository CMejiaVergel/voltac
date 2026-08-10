import * as React from "react";
import { asistenteDisponible } from "../cliente";
import { verticalConfig } from "../../vertical";
import IaAssistantLayout from "./layout";
import Actividad from "./Actividad";

export default function IaAssistantActividadPage() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Actividad disponible={disponible} />
    </IaAssistantLayout>
  );
}
