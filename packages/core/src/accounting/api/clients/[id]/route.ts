import { NextResponse } from 'next/server';
import { getDB } from '../../../../db';

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const db = await getDB();
    const client = await db.get('SELECT * FROM acc_clients WHERE id = ?', [id]);
    
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error fetching client' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const data = await req.json();
    const db = await getDB();
    
    if (!data.name) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    await db.run(
      `UPDATE acc_clients SET 
        name = ?, document_type = ?, document_number = ?, email = ?, 
        phone = ?, address = ?, tax_regime = ?, notes = ?, is_active = ? 
       WHERE id = ?`,
      [data.name, data.document_type || '', data.document_number || '', data.email || '', 
       data.phone || '', data.address || '', data.tax_regime || '', data.notes || '', 
       data.is_active !== undefined ? data.is_active : 1, id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ success: false, error: 'Error updating client' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const db = await getDB();
    // Soft delete
    await db.run(`UPDATE acc_clients SET is_active = 0 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error deleting client' }, { status: 500 });
  }
}
