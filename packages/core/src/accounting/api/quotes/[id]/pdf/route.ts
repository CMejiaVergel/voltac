import { NextResponse } from "next/server";
import { getDB } from "../../../../../db";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePDF } from "../../../../../accounting/pdf/VoltacPDF";
import React from "react";

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();

    const quote = await db.get(`
      SELECT q.*, c.name as client_name
      FROM acc_quotes q
      LEFT JOIN acc_clients c ON q.client_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = await db.all("SELECT * FROM acc_quote_items WHERE quote_id = ?", [id]);
    const client = await db.get("SELECT * FROM acc_clients WHERE id = ?", [quote.client_id]);

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(QuotePDF, { quote, items, client }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 });
  }
}
