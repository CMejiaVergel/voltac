/* Puente al nucleo: la implementacion vive en @voltac/core.

   A diferencia del resto de modulos, este NO se monta en apps/systems. No es
   un olvido: dimensionar sistemas fotovoltaicos no tiene sentido en la linea
   de software. Es el primer modulo que existe en una marca y no en la otra. */
export { default } from "@voltac/core/dimensionamiento/ui/page";

export const dynamic = "force-dynamic";
