import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function verifyAuth(req: Request, db: any) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  const isValid = await db.get('SELECT id FROM api_keys WHERE key = ?', [token]);
  return !!isValid;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDB();
    if (!(await verifyAuth(req, db))) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const lead = await db.get('SELECT id FROM quotes WHERE id = ?', [quoteId]);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const data = await req.json();
    if (!data.content) return NextResponse.json({ error: 'Missing note content' }, { status: 400 });

    const result = await db.run(
      `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 0)`,
      [quoteId, data.content, data.author || 'API External Service']
    );

    revalidatePath('/admin/leads');
    
    return NextResponse.json({ success: true, noteId: result.lastID }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
