import { NextResponse } from 'next/server';
import { getDB } from '../../../../../db';

// Convert quote to invoice
export async function POST(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();

    const quote = await db.get('SELECT * FROM acc_quotes WHERE id = ?', [id]);
    if (!quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });

    const year = new Date().getFullYear();
    const count = await db.get(`SELECT COUNT(*) as count FROM acc_invoices WHERE type='emitted'`);
    const invoiceNumber = `FAC-${year}-${String((count?.count || 0) + 1).padStart(4, '0')}`;

    // Create invoice from quote
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoiceResult = await db.run(
      `INSERT INTO acc_invoices (number, type, third_party_id, issue_date, due_date, currency, subtotal, discount, tax_total, total, status, created_by)
       VALUES (?, 'emitted', ?, ?, ?, ?, ?, ?, ?, ?, 'Borrador', 'Admin')`,
      [invoiceNumber, quote.client_id, today, dueDate, quote.currency,
       quote.subtotal, quote.discount, quote.tax_total, quote.total]
    );

    const invoiceId = invoiceResult.lastID;

    // Copy items
    const items = await db.all('SELECT * FROM acc_quote_items WHERE quote_id = ?', [id]);
    for (const item of items) {
      await db.run(
        `INSERT INTO acc_invoice_items (invoice_id, description, quantity, unit_price, discount_pct, tax_id, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.unit_price, item.discount_pct, item.tax_id, item.total]
      );
    }

    // Mark quote as converted
    await db.run(`UPDATE acc_quotes SET status='Convertida', converted_invoice_id=? WHERE id=?`, [invoiceId, id]);

    return NextResponse.json({ success: true, data: { invoice_id: invoiceId, invoice_number: invoiceNumber } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error converting quote' }, { status: 500 });
  }
}
