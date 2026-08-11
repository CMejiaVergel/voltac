/* Puente al nucleo. Aqui vuelve Google despues de autorizar: el asistente
   escucha solo en loopback y no puede recibir el retorno el mismo, asi que lo
   recibe el panel --que si esta publicado-- y se lo entrega por dentro. */
export { default } from "@voltac/core/ia-assistant/ui/page-google";

export const dynamic = "force-dynamic";
