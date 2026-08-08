/**
 * Núcleo compartido por las dos líneas de negocio de Voltac Systems S.A.S.
 *
 * Lo que vive aquí se arregla y evoluciona UNA vez y las dos aplicaciones lo
 * heredan. Lo que es propio de una marca —el estudio de viabilidad con factura
 * de Energy, el catálogo de servicios de Systems— se queda en su aplicación.
 */
export * from "./auth.js";
export * from "./vertical.js";
export * from "./paths.js";
