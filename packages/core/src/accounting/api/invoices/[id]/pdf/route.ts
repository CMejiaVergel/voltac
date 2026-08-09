import { NextResponse } from "next/server";
import { getDB } from "../../../../../db";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "../../../../../accounting/pdf/VoltacPDF";
import React from "react";

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();

    // Fetch invoice with third party name
    const invoice = await db.get(`
      SELECT i.*,
        CASE WHEN i.type='emitted' THEN c.name ELSE s.name END as third_party_name
      FROM acc_invoices i
      LEFT JOIN acc_clients c ON i.type='emitted' AND i.third_party_id=c.id
      LEFT JOIN acc_suppliers s ON i.type='received' AND i.third_party_id=s.id
      WHERE i.id = ?
    `, [id]);

    if (!invoice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch items
    const items = await db.all("SELECT * FROM acc_invoice_items WHERE invoice_id = ?", [id]);

    // Fetch third party details
    let thirdParty = null;
    if (invoice.type === "emitted") {
      thirdParty = await db.get("SELECT * FROM acc_clients WHERE id = ?", [invoice.third_party_id]);
    } else {
      thirdParty = await db.get("SELECT * FROM acc_suppliers WHERE id = ?", [invoice.third_party_id]);
    }

    // Fetch payments
    const payments = await db.all("SELECT * FROM acc_payments WHERE invoice_id = ? ORDER BY date ASC", [id]);

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(InvoicePDF, { invoice, items, payments, thirdParty }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 });
  }
}
