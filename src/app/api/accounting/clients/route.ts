import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const clients = await db.all('SELECT * FROM acc_clients ORDER BY name ASC');
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error fetching clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO acc_clients (name, document_type, document_number, email, phone, address, tax_regime, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.document_type || '', data.document_number || '', data.email || '', data.phone || '', data.address || '', data.tax_regime || '', data.notes || '']
    );
    
    return NextResponse.json({ success: true, data: { id: result.lastID, ...data } });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ success: false, error: 'Error creating client' }, { status: 500 });
  }
}
