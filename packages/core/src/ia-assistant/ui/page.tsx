import * as React from "react";
import { asistenteDisponible } from "../cliente";
import { verticalConfig } from "../../vertical";
import IaAssistantLayout from "./layout";
import Panel from "./Panel";

/**
 * La portada del módulo es el panel, no la bandeja.
 *
 * Al abrir esto la pregunta no es "qué dijo el último cliente" sino "hay algo
 * que atender". El panel responde eso y lleva a donde corresponda; entrar
 * directo a una lista de conversaciones obliga a deducirlo leyendo.
 */
export default function IaAssistantPage() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Panel disponible={disponible} />
    </IaAssistantLayout>
  );
}
