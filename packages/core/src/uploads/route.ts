import { NextResponse } from "next/server";
import { join, resolve, sep } from "path";
import { readFile } from "fs/promises";
import { uploadsDir } from "../paths";
import { currentVertical } from "../vertical";

/**
 * Sirve los archivos subidos desde el panel.
 *
 * El riesgo aqui es la travesia de directorios: `join(raiz, ...path)` con un
 * segmento `..` sale de la carpeta y permite leer cualquier archivo del
 * servidor —incluidos `.env` y la base de datos—. Se resuelve la ruta y se
 * comprueba que siga dentro de `uploads/` antes de abrir nada.
 *
 * Estaba duplicado en las dos aplicaciones, y por eso el mismo fallo aparecio
 * dos veces: solo se servian imagenes, asi que las facturas en PDF que el
 * formulario de cotizacion aceptaba y guardaba correctamente respondian 404 al
 * intentar abrirlas desde el CRM. El adjunto estaba en disco; lo que faltaba
 * era permitir leerlo.
 */

/* La raiz se ancla en la vertical de esta aplicacion. Una peticion de Systems
   no puede alcanzar los archivos de Energy ni manipulando la ruta. */
const UPLOADS_ROOT = resolve(uploadsDir(currentVertical()));

/**
 * Tipos que se sirven. Nunca se adivina a partir del contenido.
 *
 * SVG queda fuera a proposito: puede contener JavaScript y ejecutarse en el
 * origen del sitio si el navegador lo abre directamente.
 *
 * El PDF si entra —es el formato natural de una factura— y se sirve con la
 * misma cabecera de aislamiento que el resto: `sandbox` sin permisos deja al
 * visor abrirlo pero impide que el documento ejecute nada ni llame a ningun
 * sitio.
 */
const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  pdf: "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  try {
    const { path } = await params;

    // Rechazo temprano de lo que no puede ser un nombre de archivo legitimo.
    if (
      !Array.isArray(path) ||
      path.length === 0 ||
      path.some(
        (seg) =>
          !seg ||
          seg === "." ||
          seg === ".." ||
          seg.includes("\0") ||
          seg.includes("/") ||
          seg.includes("\\"),
      )
    ) {
      return new NextResponse("File not found", { status: 404 });
    }

    const filePath = resolve(join(UPLOADS_ROOT, ...path));

    // La comprobacion que importa: tras resolver symlinks y `..`, el archivo
    // tiene que seguir colgando de uploads/.
    if (filePath !== UPLOADS_ROOT && !filePath.startsWith(UPLOADS_ROOT + sep)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        // `inline` para que la factura se abra en el visor del navegador en vez
        // de descargarse: quien atiende el CRM quiere mirarla, no guardarla.
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
