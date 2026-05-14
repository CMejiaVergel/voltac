import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'Ingreso' | 'Egreso'
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const db = await getDB();

    let query = 'SELECT * FROM acc_transactions WHERE 1=1';
    const params: any[] = [];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category_id = ?'; params.push(category); }

    query += ' ORDER BY date DESC';
    const transactions = await db.all(query, params);

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error fetching transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();

    if (!data.type || !data.date || !data.amount || !data.description) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO acc_transactions 
        (type, date, amount, currency, category_id, account_id, description, payment_method, status, attachment_url, reference_id, reference_type, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type, data.date, parseFloat(data.amount), data.currency || 'COP',
        data.category_id || null, data.account_id || null, data.description,
        data.payment_method || '', data.status || 'Completado',
        data.attachment_url || null, data.reference_id || null, data.reference_type || null,
        data.notes || '', data.created_by || 'Admin'
      ]
    );

    return NextResponse.json({ success: true, data: { id: result.lastID, ...data } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error creating transaction' }, { status: 500 });
  }
}
