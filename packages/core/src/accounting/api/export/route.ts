import { NextResponse } from 'next/server';
import { getDB } from '../../../db';
import ExcelJS from 'exceljs';

/**
 * Los valores permitidos para `type` estan enumerados a proposito. Antes se
 * interpolaba el parametro crudo dentro del SQL, asi que un `?type=' OR 1=1--`
 * alteraba la consulta. Con lista blanca + parametro ligado, el valor nunca
 * llega al motor como codigo.
 */
const TIPOS_TRANSACCION = new Set(['income', 'expense']);
const TIPOS_FACTURA = new Set(['emitted', 'received']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity') || 'transactions';
    const typeParam = searchParams.get('type') || '';
    const db = await getDB();

    let rows: any[] = [];
    let sheetName = 'Datos';
    let columns: { header: string; key: string; width: number }[] = [];

    if (entity === 'transactions') {
      const type = TIPOS_TRANSACCION.has(typeParam) ? typeParam : '';
      rows = await db.all(
        `SELECT type,date,description,payment_method,amount,currency,status FROM acc_transactions WHERE status!='Anulado'${type ? ' AND type=?' : ''} ORDER BY date DESC`,
        type ? [type] : [],
      );
      sheetName = 'Ingresos y Egresos';
      columns = [
        {header:'Tipo',key:'type',width:12},{header:'Fecha',key:'date',width:12},
        {header:'Concepto',key:'description',width:35},{header:'Método',key:'payment_method',width:15},
        {header:'Monto',key:'amount',width:16},{header:'Moneda',key:'currency',width:10},{header:'Estado',key:'status',width:14},
      ];
    } else if (entity === 'clients') {
      rows = await db.all(`SELECT name,document_type,document_number,email,phone,address,tax_regime FROM acc_clients WHERE is_active=1`);
      sheetName = 'Clientes';
      columns = [
        {header:'Nombre',key:'name',width:30},{header:'Tipo Doc.',key:'document_type',width:12},
        {header:'Número Doc.',key:'document_number',width:18},{header:'Email',key:'email',width:28},
        {header:'Teléfono',key:'phone',width:15},{header:'Dirección',key:'address',width:35},{header:'Régimen',key:'tax_regime',width:18},
      ];
    } else if (entity === 'suppliers') {
      rows = await db.all(`SELECT name,document_type,document_number,email,phone,category FROM acc_suppliers WHERE is_active=1`);
      sheetName = 'Proveedores';
      columns = [
        {header:'Nombre',key:'name',width:30},{header:'Tipo Doc.',key:'document_type',width:12},
        {header:'Número Doc.',key:'document_number',width:18},{header:'Email',key:'email',width:28},
        {header:'Teléfono',key:'phone',width:15},{header:'Categoría',key:'category',width:20},
      ];
    } else if (entity === 'invoices') {
      const type = TIPOS_FACTURA.has(typeParam) ? typeParam : '';
      rows = await db.all(
        `SELECT i.number,CASE WHEN i.type='emitted' THEN c.name ELSE s.name END as third_party,i.issue_date,i.due_date,i.total,i.currency,i.status FROM acc_invoices i LEFT JOIN acc_clients c ON i.type='emitted' AND i.third_party_id=c.id LEFT JOIN acc_suppliers s ON i.type='received' AND i.third_party_id=s.id WHERE i.status!='Anulada'${type ? ' AND i.type=?' : ''}`,
        type ? [type] : [],
      );
      sheetName = 'Facturas';
      columns = [
        {header:'Número',key:'number',width:18},{header:'Tercero',key:'third_party',width:30},
        {header:'Emisión',key:'issue_date',width:12},{header:'Vencimiento',key:'due_date',width:12},
        {header:'Total',key:'total',width:16},{header:'Moneda',key:'currency',width:10},{header:'Estado',key:'status',width:18},
      ];
    }

    // Build workbook with ExcelJS (safe, actively maintained)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Voltac Systems';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns;

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    // Add data rows
    for (const row of rows) {
      const added = sheet.addRow(row);
      // Format amount/total columns as currency
      added.eachCell((cell, colNum) => {
        const col = columns[colNum - 1];
        if (col?.key === 'amount' || col?.key === 'total') {
          cell.numFmt = '"$"#,##0';
        }
      });
    }

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
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
