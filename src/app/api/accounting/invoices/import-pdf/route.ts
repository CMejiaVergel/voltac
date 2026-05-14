import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid Next.js SSR issue with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(buffer);
    const text: string = pdfData.text || "";

    // ── Extract fields with regex ──────────────────────────────────────────
    const clean = (s: string) => s.replace(/\s+/g, " ").trim();

    // NIT / Document number
    const nitMatch = text.match(/NIT[:\s.#]*([0-9]{5,12}[-–]?[0-9]?)/i)
      || text.match(/N[úu]mero de identificaci[óo]n[:\s]*([0-9]{5,12})/i);
    const nit = nitMatch ? clean(nitMatch[1]) : "";

    // Supplier/issuer name — look for "Razón Social" or first line with caps
    const razonMatch = text.match(/Raz[óo]n Social[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{3,60})/i)
      || text.match(/Emitido por[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{3,60})/i)
      || text.match(/EMISOR[:\s]*([A-ZÁÉÍÓÚÑ][^\n]{3,60})/i);
    const supplierName = razonMatch ? clean(razonMatch[1]) : "";

    // Invoice number
    const numMatch = text.match(/Factura[:\s#]*N[oú°]?\.?\s*([A-Z0-9-]{4,20})/i)
      || text.match(/N[uú]mero de factura[:\s#]*([A-Z0-9-]{4,20})/i)
      || text.match(/FE-?([A-Z0-9-]{4,20})/i);
    const invoiceNumber = numMatch ? clean(numMatch[1]) : "";

    // Date (DD/MM/YYYY or YYYY-MM-DD)
    const dateMatch = text.match(/Fecha de [Ee]misi[óo]n[:\s]*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})/i)
      || text.match(/Fecha[:\s]*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})/i);
    let issueDate = "";
    if (dateMatch) {
      const raw = dateMatch[1];
      const parts = raw.split(/[/\-\.]/);
      if (parts.length === 3) {
        // Try to detect if it's YYYY-MM-DD or DD/MM/YYYY
        const [a, b, c] = parts.map(Number);
        if (a > 31) issueDate = `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`;
        else issueDate = `${c > 100 ? c : 2000+c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
      }
    }

    // Total — look for TOTAL FACTURA or VALOR TOTAL
    const totalMatch = text.match(/(?:TOTAL|Total factura|Valor total)[^\d]*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?)/i);
    let total = 0;
    if (totalMatch) {
      const raw = totalMatch[1].replace(/\./g, "").replace(",", ".").replace(/\s/g, "");
      total = parseFloat(raw) || 0;
    }

    // IVA / Tax
    const taxMatch = text.match(/(?:IVA|Impuesto)[^\d]*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?)/i);
    let taxTotal = 0;
    if (taxMatch) {
      const raw = taxMatch[1].replace(/\./g, "").replace(",", ".").replace(/\s/g, "");
      taxTotal = parseFloat(raw) || 0;
    }

    // Subtotal
    const subMatch = text.match(/(?:Subtotal|Sub-total|Base)[^\d]*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?)/i);
    let subtotal = 0;
    if (subMatch) {
      const raw = subMatch[1].replace(/\./g, "").replace(",", ".").replace(/\s/g, "");
      subtotal = parseFloat(raw) || 0;
    }
    if (!subtotal && total > 0 && taxTotal > 0) subtotal = total - taxTotal;

    // ── Extract line items (best-effort) ─────────────────────────────────
    const items: { description: string; quantity: number; unit_price: number; total: number }[] = [];
    // Look for table rows: description followed by numbers
    const lineRegex = /^([A-Za-z\u00C0-\u024F][^\n]{4,60}?)\s+(\d+(?:[.,]\d+)?)\s+([0-9.,]+)\s+([0-9.,]+)$/gm;
    let m;
    while ((m = lineRegex.exec(text)) !== null) {
      const qty   = parseFloat(m[2].replace(",", ".")) || 1;
      const price = parseFloat(m[3].replace(/\./g, "").replace(",", ".")) || 0;
      const tot   = parseFloat(m[4].replace(/\./g, "").replace(",", ".")) || 0;
      if (price > 0) {
        items.push({ description: clean(m[1]), quantity: qty, unit_price: price, total: tot || qty * price });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        supplier_name:  supplierName,
        document_number: nit,
        invoice_number: invoiceNumber,
        issue_date:     issueDate,
        subtotal:       subtotal,
        tax_total:      taxTotal,
        total:          total,
        items,
        raw_text_preview: text.slice(0, 600),
      },
    });
  } catch (error: any) {
    console.error("PDF import error:", error);
    return NextResponse.json({ success: false, error: error.message || "Error procesando PDF" }, { status: 500 });
  }
}
