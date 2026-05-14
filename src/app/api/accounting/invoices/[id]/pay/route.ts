import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET all payments for an invoice
export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    const payments = await db.all('SELECT * FROM acc_payments WHERE invoice_id = ? ORDER BY date DESC', [id]);
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error fetching payments' }, { status: 500 });
  }
}

// POST register a new payment
export async function POST(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const db = await getDB();

    if (!data.amount || !data.date || !data.method) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Insert payment
    await db.run(
      `INSERT INTO acc_payments (invoice_id, date, amount, method, reference, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.date, parseFloat(data.amount), data.method, data.reference || '', data.notes || '']
    );

    // Recalculate invoice status based on total payments vs invoice total
    const invoice = await db.get('SELECT total FROM acc_invoices WHERE id = ?', [id]);
    const paymentsTotal = await db.get('SELECT COALESCE(SUM(amount),0) as paid FROM acc_payments WHERE invoice_id = ?', [id]);
    
    let newStatus = 'Enviada';
    if (paymentsTotal && invoice) {
      const paid = paymentsTotal.paid || 0;
      if (paid >= invoice.total) newStatus = 'Pagada';
      else if (paid > 0) newStatus = 'Parcialmente pagada';
    }

    await db.run(`UPDATE acc_invoices SET status = ? WHERE id = ?`, [newStatus, id]);

    return NextResponse.json({ success: true, data: { status: newStatus } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error registering payment' }, { status: 500 });
  }
}
