import { NextResponse } from 'next/server';
import { join, resolve, sep } from 'path';
import { readFile } from 'fs/promises';

/**
 * Sirve archivos subidos desde el panel.
 *
 * El riesgo aqui es la travesia de directorios: `join(cwd, 'uploads', ...path)`
 * con un segmento `..` sale de la carpeta y permite leer cualquier archivo del
 * servidor —incluidos `.env` y la base de datos—. Se resuelve la ruta y se
 * comprueba que siga dentro de `uploads/` antes de abrir nada.
 */
const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');

/** Solo se sirven imagenes; nunca se adivina el tipo a partir del contenido. */
const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
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
      path.some((seg) => !seg || seg === '.' || seg === '..' || seg.includes('\0') || seg.includes('/') || seg.includes('\\'))
    ) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filePath = resolve(join(UPLOADS_ROOT, ...path));

    // La comprobacion que importa: tras resolver symlinks y `..`, el archivo
    // tiene que seguir colgando de uploads/.
    if (filePath !== UPLOADS_ROOT && !filePath.startsWith(UPLOADS_ROOT + sep)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = CONTENT_TYPES[ext];
    // SVG queda fuera a proposito: puede contener JavaScript y ejecutarse en el
    // origen del sitio si el navegador lo abre directamente.
    if (!contentType) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
