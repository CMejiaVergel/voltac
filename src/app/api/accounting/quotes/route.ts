import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const db = await getDB();

    let query = `
      SELECT q.*, c.name as client_name 
      FROM acc_quotes q
      LEFT JOIN acc_clients c ON q.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status) { query += ' AND q.status = ?'; params.push(status); }
    query += ' ORDER BY q.issue_date DESC';

    const quotes = await db.all(query, params);
    return NextResponse.json({ success: true, data: quotes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error fetching quotes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();

    if (!data.client_id || !data.issue_date || !data.expiry_date) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const count = await db.get(`SELECT COUNT(*) as count FROM acc_quotes`);
    const number = `COT-${year}-${String((count?.count || 0) + 1).padStart(4, '0')}`;

    const result = await db.run(
      `INSERT INTO acc_quotes (number, client_id, issue_date, expiry_date, currency, subtotal, discount, tax_total, total, status, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [number, data.client_id, data.issue_date, data.expiry_date,
       data.currency || 'COP', parseFloat(data.subtotal || 0), parseFloat(data.discount || 0),
       parseFloat(data.tax_total || 0), parseFloat(data.total || 0), data.status || 'Borrador']
    );

    const quoteId = result.lastID;
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await db.run(
          `INSERT INTO acc_quote_items (quote_id, description, quantity, unit_price, discount_pct, tax_id, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [quoteId, item.description, item.quantity, item.unit_price, item.discount_pct || 0, item.tax_id || null, item.total]
        );
      }
    }

    return NextResponse.json({ success: true, data: { id: quoteId, number } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error creating quote' }, { status: 500 });
  }
}
