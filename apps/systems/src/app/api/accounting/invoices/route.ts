import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET all invoices (both emitted and received)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'emitted' | 'received'
    const status = searchParams.get('status');

    const db = await getDB();

    let query = `
      SELECT i.*, 
        CASE 
          WHEN i.type = 'emitted' THEN c.name 
          ELSE s.name 
        END as third_party_name
      FROM acc_invoices i
      LEFT JOIN acc_clients c ON i.type = 'emitted' AND i.third_party_id = c.id
      LEFT JOIN acc_suppliers s ON i.type = 'received' AND i.third_party_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) { query += ' AND i.type = ?'; params.push(type); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }

    query += ' ORDER BY i.created_at DESC';
    const invoices = await db.all(query, params);

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error fetching invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();

    if (!data.third_party_id || !data.issue_date || !data.due_date || !data.type) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Auto-generate invoice number
    const prefix = data.type === 'emitted' ? 'FAC' : 'FACT-REC';
    const count = await db.get(`SELECT COUNT(*) as count FROM acc_invoices WHERE type = ?`, [data.type]);
    const number = `${prefix}-${new Date().getFullYear()}-${String((count?.count || 0) + 1).padStart(4, '0')}`;

    const result = await db.run(
      `INSERT INTO acc_invoices 
        (number, type, third_party_id, issue_date, due_date, currency, subtotal, discount, tax_total, total, status, notes, terms, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        number, data.type, data.third_party_id, data.issue_date, data.due_date,
        data.currency || 'COP', parseFloat(data.subtotal || 0), parseFloat(data.discount || 0),
        parseFloat(data.tax_total || 0), parseFloat(data.total || 0), data.status || 'Borrador',
        data.notes || '', data.terms || '', 'Admin'
      ]
    );

    const invoiceId = result.lastID;

    // Wrap items in a transaction to prevent partial saves on failure
    if (data.items && data.items.length > 0) {
      await db.run("BEGIN TRANSACTION");
      try {
        for (const item of data.items) {
          const qty   = parseFloat(item.quantity)     || 1;
          const price = parseFloat(item.unit_price)   || 0;
          const dto   = parseFloat(item.discount_pct) || 0;
          // Always calculate total server-side to avoid NOT NULL failures
          const itemTotal = qty * price * (1 - dto / 100);
          await db.run(
            `INSERT INTO acc_invoice_items (invoice_id, description, quantity, unit_price, discount_pct, tax_id, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [invoiceId, item.description || "", qty, price, dto, item.tax_id || null, itemTotal]
          );
        }
        await db.run("COMMIT");
      } catch (itemErr) {
        await db.run("ROLLBACK");
        throw itemErr;
      }
    }

    return NextResponse.json({ success: true, data: { id: invoiceId, number } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error creating invoice' }, { status: 500 });
  }
}
