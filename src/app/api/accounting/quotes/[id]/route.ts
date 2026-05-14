import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    const quote = await db.get(`SELECT q.*, c.name as client_name FROM acc_quotes q LEFT JOIN acc_clients c ON q.client_id = c.id WHERE q.id = ?`, [id]);
    if (!quote) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const items = await db.all('SELECT * FROM acc_quote_items WHERE quote_id = ?', [id]);
    return NextResponse.json({ success: true, data: { ...quote, items } });
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
      `UPDATE acc_quotes SET client_id=?, issue_date=?, expiry_date=?, currency=?, subtotal=?, discount=?, tax_total=?, total=?, status=? WHERE id=?`,
      [data.client_id, data.issue_date, data.expiry_date, data.currency || 'COP',
       data.subtotal, data.discount || 0, data.tax_total || 0, data.total, data.status, id]
    );

    if (data.items) {
      await db.run('DELETE FROM acc_quote_items WHERE quote_id = ?', [id]);
      for (const item of data.items) {
        await db.run(
          `INSERT INTO acc_quote_items (quote_id, description, quantity, unit_price, discount_pct, tax_id, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.description, item.quantity, item.unit_price, item.discount_pct || 0, item.tax_id || null, item.total]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error updating quote' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    await db.run(`UPDATE acc_quotes SET status = 'Anulada' WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}
