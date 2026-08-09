import { NextResponse } from 'next/server';
import { getDB } from '../../../../db';

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();

    const invoice = await db.get(`
      SELECT i.*, 
        CASE WHEN i.type = 'emitted' THEN c.name ELSE s.name END as third_party_name
      FROM acc_invoices i
      LEFT JOIN acc_clients c ON i.type = 'emitted' AND i.third_party_id = c.id
      LEFT JOIN acc_suppliers s ON i.type = 'received' AND i.third_party_id = s.id
      WHERE i.id = ?
    `, [id]);

    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const items = await db.all('SELECT * FROM acc_invoice_items WHERE invoice_id = ?', [id]);
    return NextResponse.json({ success: true, data: { ...invoice, items } });
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
      `UPDATE acc_invoices SET
        third_party_id = ?, issue_date = ?, due_date = ?, currency = ?,
        subtotal = ?, discount = ?, tax_total = ?, total = ?,
        status = ?, notes = ?, terms = ?
       WHERE id = ?`,
      [data.third_party_id, data.issue_date, data.due_date, data.currency || 'COP',
       data.subtotal, data.discount || 0, data.tax_total || 0, data.total,
       data.status, data.notes || '', data.terms || '', id]
    );

    // Update items if provided
    if (data.items) {
      await db.run('DELETE FROM acc_invoice_items WHERE invoice_id = ?', [id]);
      for (const item of data.items) {
        await db.run(
          `INSERT INTO acc_invoice_items (invoice_id, description, quantity, unit_price, discount_pct, tax_id, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.description, item.quantity, item.unit_price, item.discount_pct || 0, item.tax_id || null, item.total]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error updating invoice' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    await db.run(`UPDATE acc_invoices SET status = 'Anulada' WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}
