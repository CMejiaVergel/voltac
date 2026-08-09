import { join, resolve } from "node:path";

/**
 * Dónde viven los datos.
 *
 * Antes cada aplicación resolvía la base y los adjuntos contra
 * `process.cwd()`. Eso funcionaba mientras la app era la raíz del proyecto,
 * pero en el monorepo el directorio de trabajo pasa a ser `apps/systems` o
 * `apps/energy`, así que cada una buscaría su propia copia — justo lo
 * contrario de lo que queremos ahora que la contabilidad es común.
 *
 * `VOLTAC_DATA_DIR` apunta a un único directorio compartido por las dos
 * aplicaciones. Sin él se cae al directorio de trabajo, que es lo cómodo en
 * desarrollo y lo correcto para no romper una instalación existente.
 */
export function dataDir(): string {
  return resolve(process.env.VOLTAC_DATA_DIR ?? process.cwd());
}

/**
 * Base operativa de una línea de negocio: prospectos, proyectos y noticias.
 * Cada marca tiene la suya, y esa es la garantía de que no se mezclan.
 */
export function operationalPath(vertical: string): string {
  return join(dataDir(), vertical, "voltac.db");
}

/**
 * Contabilidad. Una sola para toda la empresa: Voltac Systems S.A.S. está
 * constituida una vez y los contadores necesitan la facturación completa,
 * sin importar de qué frente comercial venga cada factura.
 */
export function accountingPath(): string {
  return join(dataDir(), "contabilidad.db");
}

/**
 * Identidad: usuarios del panel y registro de auditoría.
 *
 * Va aparte de la contabilidad aunque las dos sean compartidas. El guion de
 * restauración repone la contabilidad a un punto anterior cuando algo sale mal,
 * y arrastrar en esa vuelta atrás las cuentas de usuario y el registro de quién
 * hizo qué sería perder justo lo que hace falta para entender el incidente.
 */
export function systemPath(): string {
  return join(dataDir(), "sistema.db");
}

/**
 * Raíz de los archivos subidos desde el panel.
 *
 * Los adjuntos sí se separan por línea de negocio: las imágenes de un proyecto
 * de energía solar no tienen por qué convivir con las de un proyecto de
 * software, y tenerlas separadas hace evidente a quién pertenece cada archivo
 * cuando haya que depurar o migrar.
 */
export function uploadsDir(vertical: string, ...segments: string[]): string {
  return join(dataDir(), "uploads", vertical, ...segments);
}

/**
 * URL pública de un adjunto, tal como se guarda en base de datos.
 *
 * Deliberadamente NO lleva la vertical: el endpoint que sirve los archivos la
 * añade a partir de la aplicación que atiende la petición. Así las direcciones
 * que ya estaban guardadas —de antes de separar los adjuntos por marca— siguen
 * resolviendo, y una misma URL nunca puede apuntar a los archivos de la otra
 * marca por mucho que se manipule.
 */
export function uploadsUrl(...segments: string[]): string {
  return "/api/uploads/" + segments.join("/");
}
