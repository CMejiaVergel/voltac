import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const modality = formData.get('modality') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    
    const email = formData.get('email') as string | null;
    const consumption = formData.get('consumption') ? parseFloat(formData.get('consumption') as string) : null;
    const address = formData.get('address') as string | null;
    const installType = formData.get('installType') as string | null;
    const location = formData.get('location') as string | null;
    const objective = formData.get('objective') as string | null;
    const gridType = formData.get('gridType') as string | null;
    const message = formData.get('message') as string | null;

    let relativeFilePath = null;
    const file = formData.get('file') as File | null;

    if (file && file.size > 0 && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Guardar fuera de public/ para que funcione en producción post-build
      const uploadDir = join(process.cwd(), 'uploads', 'quotes');
      await mkdir(uploadDir, { recursive: true });
      
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = Date.now() + '-' + safeName;
      const absolutePath = join(uploadDir, uniqueName);
      
      await writeFile(absolutePath, buffer);
      relativeFilePath = '/api/uploads/quotes/' + uniqueName;
    }

    const database = await getDB();
    
    // Business rule: Detallada gets priority 'Alta'
    const priority = modality === 'detailed' ? 'Alta' : 'Media';
    
    await database.run(
      `INSERT INTO quotes (
        modality, fullName, phone, email, consumption, address, installType, 
        location, objective, gridType, message, filePath, priority, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Web')`,
      [modality, fullName, phone, email || null, consumption || null, address || null, installType || null, location || null, objective || null, gridType || null, message || null, relativeFilePath, priority]
    );

    revalidatePath('/admin/leads');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Database or upload failed' }, { status: 500 });
  }
}
