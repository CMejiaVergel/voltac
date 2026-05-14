import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();

    const [ingresos, egresos, invoicesSummary, clientsCount, pendingInvoices, overdueInvoices, topClients, recentTx] = await Promise.all([
      db.get(`SELECT COALESCE(SUM(amount),0) as total FROM acc_transactions WHERE type='Ingreso' AND status != 'Anulado'`),
      db.get(`SELECT COALESCE(SUM(amount),0) as total FROM acc_transactions WHERE type='Egreso' AND status != 'Anulado'`),
      db.get(`SELECT 
        COALESCE(SUM(CASE WHEN status='Pagada' THEN total ELSE 0 END),0) as paid,
        COALESCE(SUM(CASE WHEN status IN ('Enviada','Parcialmente pagada') THEN total ELSE 0 END),0) as pending,
        COALESCE(SUM(CASE WHEN status='Vencida' THEN total ELSE 0 END),0) as overdue,
        COUNT(*) as total_count
        FROM acc_invoices WHERE type='emitted' AND status != 'Anulada'`),
      db.get(`SELECT COUNT(*) as count FROM acc_clients WHERE is_active=1`),
      db.get(`SELECT COUNT(*) as count FROM acc_invoices WHERE status IN ('Enviada','Parcialmente pagada') AND type='emitted'`),
      db.get(`SELECT COUNT(*) as count, COALESCE(SUM(total),0) as amount FROM acc_invoices WHERE status='Vencida' AND type='emitted'`),
      db.all(`SELECT c.name, COALESCE(SUM(i.total),0) as total FROM acc_invoices i JOIN acc_clients c ON i.third_party_id=c.id WHERE i.type='emitted' AND i.status != 'Anulada' GROUP BY c.id ORDER BY total DESC LIMIT 5`),
      db.all(`SELECT * FROM acc_transactions WHERE status != 'Anulado' ORDER BY date DESC LIMIT 8`),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cashflow: {
          income: ingresos?.total || 0,
          expenses: egresos?.total || 0,
          balance: (ingresos?.total || 0) - (egresos?.total || 0),
        },
        invoices: invoicesSummary,
        clients_count: clientsCount?.count || 0,
        pending_invoices: pendingInvoices?.count || 0,
        overdue_invoices: overdueInvoices,
        top_clients: topClients,
        recent_transactions: recentTx,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error fetching dashboard data' }, { status: 500 });
  }
}
