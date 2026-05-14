import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity') || 'transactions'; // transactions | clients | suppliers | invoices
    const type = searchParams.get('type') || '';
    const db = await getDB();

    let rows: any[] = [];
    let sheetName = 'Datos';

    if (entity === 'transactions') {
      let q = `SELECT type as 'Tipo', date as 'Fecha', description as 'Concepto', payment_method as 'Método', amount as 'Monto', currency as 'Moneda', status as 'Estado' FROM acc_transactions WHERE status != 'Anulado'`;
      if (type) q += ` AND type = '${type}'`;
      q += ' ORDER BY date DESC';
      rows = await db.all(q);
      sheetName = 'Ingresos y Egresos';
    } else if (entity === 'clients') {
      rows = await db.all(`SELECT name as 'Nombre', document_type as 'Tipo Doc.', document_number as 'Número Doc.', email as 'Email', phone as 'Teléfono', address as 'Dirección', tax_regime as 'Régimen' FROM acc_clients WHERE is_active=1`);
      sheetName = 'Clientes';
    } else if (entity === 'suppliers') {
      rows = await db.all(`SELECT name as 'Nombre', document_type as 'Tipo Doc.', document_number as 'Número Doc.', email as 'Email', phone as 'Teléfono', category as 'Categoría' FROM acc_suppliers WHERE is_active=1`);
      sheetName = 'Proveedores';
    } else if (entity === 'invoices') {
      let q = `SELECT i.number as 'Número', CASE WHEN i.type='emitted' THEN c.name ELSE s.name END as 'Tercero', i.issue_date as 'Emisión', i.due_date as 'Vencimiento', i.total as 'Total', i.currency as 'Moneda', i.status as 'Estado' FROM acc_invoices i LEFT JOIN acc_clients c ON i.type='emitted' AND i.third_party_id=c.id LEFT JOIN acc_suppliers s ON i.type='received' AND i.third_party_id=s.id WHERE i.status != 'Anulada'`;
      if (type) q += ` AND i.type = '${type}'`;
      rows = await db.all(q);
      sheetName = 'Facturas';
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="voltac_${entity}_${new Date().toISOString().slice(0,10)}.xlsx"`,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Error generating export' }, { status: 500 });
  }
}
