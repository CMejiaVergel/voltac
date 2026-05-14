import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    const db = await getDB();

    let events = await db.all(`SELECT * FROM acc_calendar_events ORDER BY date ASC`);

    // Also pull invoice due dates as virtual events
    const invoices = await db.all(`
      SELECT i.id, i.number, i.due_date as date, i.total, i.status,
        CASE WHEN i.type='emitted' THEN c.name ELSE s.name END as third_party_name
      FROM acc_invoices i
      LEFT JOIN acc_clients c ON i.type='emitted' AND i.third_party_id=c.id
      LEFT JOIN acc_suppliers s ON i.type='received' AND i.third_party_id=s.id
      WHERE i.status NOT IN ('Pagada','Anulada')
    `);

    const invoiceEvents = invoices.map((inv: any) => ({
      id: `inv-${inv.id}`,
      title: `Vence ${inv.number}`,
      type: 'invoice_due',
      date: inv.date?.slice(0, 10),
      description: `${inv.third_party_name} — Total: ${inv.total}`,
      linked_id: inv.id,
      linked_type: 'invoice',
      status: inv.status,
      virtual: true,
    }));

    const allEvents = [...events, ...invoiceEvents];
    const filtered = month ? allEvents.filter(e => e.date?.startsWith(month)) : allEvents;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error fetching events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDB();

    if (!data.title || !data.date) {
      return NextResponse.json({ success: false, error: 'Título y fecha son requeridos' }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO acc_calendar_events (title, type, date, time, description, linked_id, linked_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.type || 'general', data.date, data.time || null,
       data.description || '', data.linked_id || null, data.linked_type || null]
    );

    return NextResponse.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error creating event' }, { status: 500 });
  }
}
