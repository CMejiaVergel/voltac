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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDB();
    if (!(await verifyAuth(req, db))) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const lead = await db.get(`SELECT * FROM quotes WHERE id = ?`, [id]);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const notes = await db.all(`SELECT * FROM notes WHERE quoteId = ? ORDER BY createdAt ASC`, [id]);
    lead.notes = notes;

    return NextResponse.json({ success: true, data: lead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDB();
    if (!(await verifyAuth(req, db))) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const data = await req.json();
    const oldLead = await db.get(`SELECT * FROM quotes WHERE id = ?`, [id]);
    if (!oldLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const updates: string[] = [];
    const values: any[] = [];
    let stateChanged = false;
    let changesLog = [];

    const mutableFields = ['stage', 'status', 'followUpDate', 'priority', 'tags', 'assignedTo', 'projectType'];
    for (const f of mutableFields) {
      if (data[f] !== undefined && data[f] !== oldLead[f]) {
        updates.push(`${f} = ?`);
        values.push(data[f]);
        changesLog.push(`${f} updated via API`);
        if (f === 'stage' || f === 'status') stateChanged = true;
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await db.run(`UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`, values);
      
      if (stateChanged || changesLog.length > 0) {
        await db.run(
          `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 1)`,
          [id, `Lead update via API: ${changesLog.join(', ')}`, 'API Client']
        );
      }
      revalidatePath('/admin/leads');
    }

    const updatedLead = await db.get(`SELECT * FROM quotes WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, data: updatedLead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
