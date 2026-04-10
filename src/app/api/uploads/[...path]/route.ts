import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  try {
    // Handling both Promise and sync object for Next.js 14/15 compatibility
    const resolvedParams = await params;
    const { path } = resolvedParams;
    const filePath = join(process.cwd(), 'uploads', ...path);
    
    const fileBuffer = await readFile(filePath);
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
