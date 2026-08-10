/* Puente al nucleo: la implementacion vive en @voltac/core y la comparten
   las dos lineas de negocio. No editar aqui.

   Energy monta exactamente el mismo modulo. Sin ASISTENTE_URL configurada se
   pinta completo pero inerte: la diferencia esta en el entorno, no aqui. */
export { default } from "@voltac/core/ia-assistant/ui/page";

export const dynamic = "force-dynamic";
