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

/** Ruta pública equivalente a `uploadsDir`, para guardar en base de datos. */
export function uploadsUrl(vertical: string, ...segments: string[]): string {
  return "/api/uploads/" + [vertical, ...segments].join("/");
}
