import * as React from "react";
import { asistenteDisponible } from "../../ia-assistant/cliente";
import IaAssistantLayout from "../../ia-assistant/ui/layout";
import { verticalConfig } from "../../vertical";
import Tareas from "./Tareas";

/**
 * Pestaña de Tareas del asistente.
 *
 * Monta el armazon de IA Assistant igual que las demas paginas del modulo. En
 * esta plataforma el layout NO se hereda por carpeta --no hay `layout.tsx` en
 * la ruta-- sino que cada pagina lo envuelve. La primera version de este
 * archivo devolvia solo el contenido, y el resultado era una pantalla sin
 * cabecera y sin pestañas: se entraba a Tareas y no habia forma de volver a
 * Conversaciones sin escribir la URL.
 */
export default function PaginaTareas() {
  const disponible = asistenteDisponible();
  const linea = verticalConfig();

  return (
    <IaAssistantLayout disponible={disponible} nombreLinea={linea.name}>
      <Tareas />
    </IaAssistantLayout>
  );
}
