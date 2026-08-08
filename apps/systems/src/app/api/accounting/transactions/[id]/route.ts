import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    const tx = await db.get('SELECT * FROM acc_transactions WHERE id = ?', [id]);
    if (!tx) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: tx });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const db = await getDB();

    await db.run(
      `UPDATE acc_transactions SET
        type = ?, date = ?, amount = ?, currency = ?, category_id = ?, account_id = ?,
        description = ?, payment_method = ?, status = ?, notes = ?
       WHERE id = ?`,
      [data.type, data.date, parseFloat(data.amount), data.currency || 'COP',
       data.category_id || null, data.account_id || null, data.description,
       data.payment_method || '', data.status || 'Completado', data.notes || '', id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error updating' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    // Mark as Anulado instead of hard delete for audit trail
    await db.run(`UPDATE acc_transactions SET status = 'Anulado' WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}
