import { NextResponse } from "next/server";
import { extractText } from "unpdf";

const clean = (s: string) => s?.replace(/\s+/g, " ").trim() || "";
const parseAmount = (s: string) =>
  parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/\s/g, "")) || 0;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { text: rawText } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = rawText || "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // ── NIT ──────────────────────────────────────────────────────────────
    const nitMatch =
      text.match(/NIT[:\s#.]*([0-9]{3}[.\s-]?[0-9]{3}[.\s-]?[0-9]{3}[-\s]?[0-9])/i) ||
      text.match(/([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9])/);
    const nit = nitMatch ? clean(nitMatch[1]).replace(/[.\s]/g, "") : "";

    // ── Supplier name: labeled OR heuristic (line before NIT) ────────────
    const razonMatch =
      text.match(/Raz[óo]n Social[:\s]*([^\n]{5,80})/i) ||
      text.match(/(?:Vendedor|Proveedor|Emisor)[:\s]+([A-ZÁÉÍÓÚÑ][^\n]{4,80})/i);
    let supplierName = razonMatch ? clean(razonMatch[1]) : "";
    if (!supplierName) {
      const nitIdx = lines.findIndex((l) => /\bNIT\b/i.test(l));
      for (let i = Math.max(0, nitIdx - 3); i < nitIdx && nitIdx > 0; i++) {
        const c = lines[i];
        if (c.length > 4 && !/^\d/.test(c) && !/fecha|factura|cufe|correo|tel/i.test(c)) {
          supplierName = c.slice(0, 100); break;
        }
      }
    }

    // ── Invoice number ─────────────────────────────────────────────────
    const numMatch =
      text.match(/(?:Factura[^\n]*N[°oú]?\.?|N[uú]mero de Factura|No\. de Factura)[:\s#]*([A-Z0-9\-]{3,30})/i) ||
      text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,25})\b/i) ||
      text.match(/\b(FE[-\s]?[A-Z0-9\-]{3,25})\b/i) ||
      text.match(/\b(RV[0-9]{2,6})\b/i);
    const invoiceNumber = numMatch ? clean(numMatch[1]) : "";

    // ── CUFE ──────────────────────────────────────────────────────────
    const cufeMatch = text.match(/CUFE[:\s]*([a-f0-9]{60,100})/i);
    const cufe = cufeMatch ? cufeMatch[1] : "";

    // ── Dates ─────────────────────────────────────────────────────────
    const toISO = (raw: string): string => {
      const parts = raw.split(/[\/\-]/);
      if (parts.length !== 3) return "";
      const [a, b, c] = parts.map(Number);
      return a > 31
        ? `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`
        : `${c > 100 ? c : 2000+c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
    };

    const issueDateMatch =
      text.match(/Fecha de [Ee]misi[óo]n[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
      text.match(/Fecha[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
      text.match(/(\d{4}-\d{2}-\d{2})/);
    const issueDate = issueDateMatch ? toISO(issueDateMatch[1]) : "";

    const dueDateMatch = text.match(
      /(?:Fecha de [Vv]enc|Vencimiento|Plazo|V[áa]lido hasta)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    );
    const dueDate = dueDateMatch ? toISO(dueDateMatch[1]) : "";

    // ── Amounts ────────────────────────────────────────────────────────
    // Siigo uses: "Total Factura", "TOTAL", "Total a pagar"
    const totalMatch = text.match(
      /(?:Total Factura|TOTAL A PAGAR|Total a [Pp]agar|TOTAL)[^\d$\n]{0,10}\$?\s*([\d.,]{4,20})/i
    );
    const total = totalMatch ? parseAmount(totalMatch[1]) : 0;

    // Siigo uses: "Valor Bruto", "Base Gravable", "Subtotal"
    const baseMatch = text.match(
      /(?:Valor [Bb]ruto|Base [Gg]ravable|Subtotal|Sub[- ]total)[^\d$\n]{0,10}\$?\s*([\d.,]{4,20})/i
    );
    const subtotal = baseMatch ? parseAmount(baseMatch[1]) : 0;

    const ivaMatch = text.match(
      /(?:Valor IVA|IVA 19%?|Impuesto[^\n]{0,30})[^\d$\n]{0,10}\$?\s*([\d.,]{4,20})/i
    );
    const taxTotal = ivaMatch
      ? parseAmount(ivaMatch[1])
      : total > 0 && subtotal > 0 ? total - subtotal : 0;

    // ── Items: Siigo-aware section parsing ─────────────────────────────
    // Strategy: Find the items table by locating "Descripción" header,
    // then scan lines until we hit the totals block.
    const items: { description: string; quantity: number; unit_price: number; total: number }[] = [];

    // Find start of items table
    const descIdx = lines.findIndex((l) => /^Descripci[oó]n/i.test(l) || /Descripci[oó]n.*Cantidad/i.test(l));
    // Find end of items table (totals section)
    const totalsIdx = lines.findIndex((l) => /(?:Subtotal|Total Factura|Base [Gg]ravable|TOTAL)/i.test(l));
    const itemStart = descIdx >= 0 ? descIdx + 1 : 0;
    const itemEnd   = totalsIdx > itemStart ? totalsIdx : lines.length;

    // Each item row in Siigo has the description, then qty, unit price, and total
    // Since PDF columns may be on same or separate lines, scan for money-like values
    const amountPat = /^[\d.,]{4,20}$/;
    let i = itemStart;
    while (i < itemEnd) {
      const line = lines[i];
      // Skip empty or pure-header lines
      if (!line || /^(Descripci|Cantidad|Precio|Unidad|IVA|Descuento|Subtotal|Total)/i.test(line)) { i++; continue; }
      // Check if next lines contain amounts (qty, price, total)
      const lookahead = lines.slice(i + 1, i + 6);
      const amounts = lookahead.filter((l) => amountPat.test(l.replace(/[.,\s]/g, "")) && parseAmount(l) > 0);
      if (amounts.length >= 2) {
        const qty   = parseFloat(amounts[0].replace(",", ".")) || 1;
        const price = parseAmount(amounts[1]);
        const tot   = amounts[2] ? parseAmount(amounts[2]) : qty * price;
        if (price > 1_000) {
          items.push({ description: clean(line), quantity: qty, unit_price: price, total: tot });
        }
        i += 1 + amounts.length; continue;
      }
      // Fallback: same-line pattern "Description  qty  price  total"
      const sameLineMatch = line.match(/^(.{5,60?}?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]{4,20})\s+([\d.,]{4,20})$/);
      if (sameLineMatch) {
        const qty   = parseFloat(sameLineMatch[2].replace(",", ".")) || 1;
        const price = parseAmount(sameLineMatch[3]);
        const tot   = parseAmount(sameLineMatch[4]);
        if (price > 1_000) items.push({ description: clean(sameLineMatch[1]), quantity: qty, unit_price: price, total: tot });
      }
      i++;
    }

    return NextResponse.json({
      success: true,
      data: {
        supplier_name:    supplierName,
        document_number:  nit,
        invoice_number:   invoiceNumber,
        cufe,
        issue_date:       issueDate,
        due_date:         dueDate,
        subtotal,
        tax_total:        taxTotal,
        total,
        items,
        // Debug: send full text so we can tune extraction if needed
        raw_text_preview: text.slice(0, 3000),
        raw_lines_sample: lines.slice(0, 80),
      },
    });
  } catch (error: any) {
    console.error("PDF import error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error procesando PDF" },
      { status: 500 }
    );
  }
}
