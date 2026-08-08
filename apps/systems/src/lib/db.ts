/**
 * La capa de datos vive en @voltac/core: una sola implementacion para las dos
 * lineas de negocio. Este archivo existe solo para no reescribir los ~90 sitios
 * que ya importan desde "@/lib/db".
 */
export { getDB } from "@voltac/core/db";
