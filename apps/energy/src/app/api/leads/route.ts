import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

async function verifyAuth(req: Request, db: any) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  const isValid = await db.get('SELECT id FROM api_keys WHERE key = ?', [token]);
  return !!isValid;
}

export async function GET(req: Request) {
  try {
    const db = await getDB();
    if (!(await verifyAuth(req, db))) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filters: string[] = ['(isDeleted = 0 OR isDeleted IS NULL)'];
    const values: any[] = [];

    const allowedFilters = ['etapa', 'fuente', 'modalidad', 'estado'];
    for (const f of allowedFilters) {
      if (searchParams.has(f)) {
        filters.push(`${f === 'etapa' ? 'stage' : f === 'fuente' ? 'source' : f === 'estado' ? 'status' : 'modality'} = ?`);
        values.push(searchParams.get(f));
      }
    }

    if (searchParams.has('fecha_desde')) {
      filters.push(`createdAt >= ?`);
      values.push(searchParams.get('fecha_desde'));
    }
    if (searchParams.has('fecha_hasta')) {
      filters.push(`createdAt <= ?`);
      values.push(searchParams.get('fecha_hasta'));
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const leads = await db.all(`SELECT * FROM quotes ${whereClause} ORDER BY createdAt DESC`, values);

    return NextResponse.json({ success: true, count: leads.length, data: leads });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDB();
    if (!(await verifyAuth(req, db))) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const data = await req.json();
    if (!data.fullName || !data.phone) return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });

    const priority = data.modality === 'detallada' ? 'Alta' : (data.priority || 'Media');
    
    const result = await db.run(
      `INSERT INTO quotes (
        modality, fullName, phone, email, projectType, message, 
        stage, status, priority, assignedTo, followUpDate, tags, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.modality || 'manual', data.fullName, data.phone, data.email || null, data.projectType || null, data.message || null,
        data.stage || 'Nuevo', data.status || 'Pendiente de contacto', priority, data.assignedTo || null, data.followUpDate || null, 
        data.tags || '[]', data.source || 'API'
      ]
    );

    const newLead = await db.get(`SELECT * FROM quotes WHERE id = ?`, [result.lastID]);
    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
