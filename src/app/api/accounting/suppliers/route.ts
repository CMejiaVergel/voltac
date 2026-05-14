import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const suppliers = await db.all('SELECT * FROM acc_suppliers ORDER BY name ASC');
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error fetching suppliers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();
    
    if (!data.name) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO acc_suppliers (name, document_type, document_number, email, phone, address, category, bank_account, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.document_type || '', data.document_number || '', data.email || '', data.phone || '', data.address || '', data.category || '', data.bank_account || '', data.notes || '']
    );
    
    return NextResponse.json({ success: true, data: { id: result.lastID, ...data } });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ success: false, error: 'Error creating supplier' }, { status: 500 });
  }
}
