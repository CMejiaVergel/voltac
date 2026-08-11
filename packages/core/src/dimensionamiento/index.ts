/**
 * Dimensionamiento de sistemas fotovoltaicos.
 *
 * Vive en el núcleo y no en `apps/energy` porque tiene tres consumidores: el
 * módulo del panel donde el asesor calcula a mano, la API que consulta el
 * asistente de WhatsApp, y —más adelante— la calculadora pública del sitio.
 * Los tres tienen que dar el mismo número. Un cliente que calcula en la web,
 * pregunta por WhatsApp y luego habla con un asesor no puede recibir tres
 * cifras distintas.
 */
export * from "./datos";
export * from "./motor";
export * from "./calificacion";
