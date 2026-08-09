/**
 * Reduce una foto antes de subirla.
 *
 * La modalidad exprés pide una foto de la factura, y los teléfonos actuales la
 * producen de 8 a 15 MB. Ese peso causaba dos problemas: el cuerpo de la
 * petición se cortaba en el servidor y el prospecto se perdía, y quien la
 * enviaba desde datos móviles esperaba medio minuto sin saber si iba bien.
 *
 * Una factura se lee de sobra a 1600 px de ancho. Comprimirla aquí la deja en
 * unos cientos de kilobytes, la subida es inmediata y el servidor recibe algo
 * que puede procesar entero.
 *
 * Si algo falla —un formato que el navegador no sabe dibujar, como algunos
 * HEIC— se devuelve el archivo original sin tocar: es preferible intentar subir
 * el grande a quedarse sin factura.
 */

const ANCHO_MAXIMO = 1600;
const CALIDAD = 0.82;
/** Por debajo de esto no vale la pena recomprimir. */
const UMBRAL_BYTES = 700 * 1024;

export async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo; // los PDF pasan enteros
  if (archivo.size <= UMBRAL_BYTES) return archivo;

  try {
    const bitmap = await createImageBitmap(archivo);

    const escala = Math.min(1, ANCHO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;

    const ctx = lienzo.getContext("2d");
    if (!ctx) return archivo;

    // Fondo blanco: si la imagen trae transparencia, en JPEG saldría negra.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      lienzo.toBlob(resolve, "image/jpeg", CALIDAD),
    );
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return archivo;
  }
}

/** Tamaño legible, para enseñárselo a quien sube el archivo. */
export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
