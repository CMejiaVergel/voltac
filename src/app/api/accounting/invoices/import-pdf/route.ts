import { NextResponse } from "next/server";
import { extractText } from "unpdf";

// Smart amount parser — handles BOTH US format (1,234.56) and Colombian (1.234,56)
const parseAmount = (s: string): number => {
  if (!s) return 0;
  const t = s.replace(/\s/g, "");
  const lastDot   = t.lastIndexOf(".");
  const lastComma = t.lastIndexOf(",");
  let n: string;
  if (lastDot > lastComma) {
    // US format: "7,499,999.99" → remove commas → "7499999.99"
    n = t.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    // Colombian: "7.499.999,99" → remove dots, comma→dot → "7499999.99"
    n = t.replace(/\./g, "").replace(",", ".");
  } else {
    n = t.replace(/,/g, "");
  }
  return parseFloat(n) || 0;
};

const clean = (s: string) => s?.replace(/\s+/g, " ").trim() || "";

// Convert various date formats to ISO YYYY-MM-DD
const toISO = (raw: string): string => {
  if (!raw || raw === "--") return "";
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-]/);
  if (parts.length !== 3) return "";
  const [a, b, c] = parts.map(Number);
  // YY-MM-DD or DD/MM/YY
  if (a > 31) return `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`;
  return `${c > 100 ? c : 2000+c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const { text: rawText } = await extractText(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
    const text  = rawText || "";
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // ── ISSUER (top of document) ──────────────────────────────────────────
    // iSiigo: first line is company name, second line "NIT XXXXXXXXX-X"
    const firstNitIdx = lines.findIndex(l => /^NIT\b/i.test(l));
    const issuerName  = firstNitIdx > 0 ? clean(lines[firstNitIdx - 1]) : "";
    const issuerNitRaw = firstNitIdx >= 0
      ? (lines[firstNitIdx].replace(/^NIT\s*/i,"").trim() ||        // NIT on same line
         (lines[firstNitIdx + 1] || ""))                             // or next line
      : "";
    const issuerNit = issuerNitRaw.replace(/[.\s]/g, "").match(/[\d-]{5,15}/)?.[0] || "";

    // ── CLIENT (after "Señores" keyword) ─────────────────────────────────
    const sIdx = lines.findIndex(l => /^Se[ñn]ores?$/i.test(l));
    let clientName = "";
    let clientNit  = "";
    if (sIdx >= 0) {
      clientName = clean(lines[sIdx + 1] || "");
      // Find "NIT" label and grab next non-empty line as the NIT value
      const clientSlice = lines.slice(sIdx + 1, sIdx + 15);
      const cNitIdx = clientSlice.findIndex(l => /^NIT$/i.test(l));
      if (cNitIdx >= 0) {
        const raw = clientSlice[cNitIdx + 1] || "";
        clientNit = raw.replace(/[.\s]/g, "").match(/[\d-]{5,15}/)?.[0] || "";
      }
    }

    // ── Invoice number ────────────────────────────────────────────────────
    // iSiigo: "Factura\nNo. 1" or "No. 1"
    const numLineIdx = lines.findIndex(l => /^No\.?\s*\d+$/i.test(l) || /^N[°o]\s*\d+$/i.test(l));
    let invoiceNumber = "";
    if (numLineIdx >= 0) {
      invoiceNumber = lines[numLineIdx].replace(/^No\.?\s*/i, "").trim();
    } else {
      // Fallback: look for FEV pattern
      const fev = text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,25})\b/i) || text.match(/\b(RV[0-9]{2,6})\b/i);
      invoiceNumber = fev ? fev[1] : "";
    }

    // ── Dates ─────────────────────────────────────────────────────────────
    // iSiigo: "Fecha elaboración\n2025-12-15" or "Fecha de Vencimiento\n2025-12-15"
    const findDateAfterLabel = (label: RegExp): string => {
      const idx = lines.findIndex(l => label.test(l));
      if (idx < 0) return "";
      // Date might be on the same line or the next
      const sameLine = lines[idx].replace(label, "").trim();
      if (/\d/.test(sameLine)) return toISO(sameLine.match(/[\d\/\-]+/)?.[0] || "");
      const next = (lines[idx + 1] || "").trim();
      return toISO(next.match(/[\d\/\-]+/)?.[0] || "");
    };
    const issueDate = findDateAfterLabel(/Fecha\s+(?:elaboraci[oó]n|de\s+emisi[oó]n)/i);
    const dueDate   = findDateAfterLabel(/Fecha\s+de\s+[Vv]enc/i) ||
                      findDateAfterLabel(/Vencimiento/i);

    // ── Items: iSiigo table format ────────────────────────────────────────
    // Header line: "Ítem  Descripción  Cantidad  Vr. Total"
    // Rows (each column on its own line): item_num, description, qty, total
    const items: { description: string; quantity: number; unit_price: number; total: number }[] = [];
    const tableStartIdx = lines.findIndex(l => /Vr\.?\s*Total/i.test(l));
    const tableEndIdx   = lines.findIndex(l => /Total\s+items?:/i.test(l));

    if (tableStartIdx >= 0) {
      const endIdx = tableEndIdx > tableStartIdx ? tableEndIdx : tableStartIdx + 50;
      let i = tableStartIdx + 1;
      while (i < endIdx) {
        const line = lines[i];
        // Item number is a standalone integer
        if (/^\d+$/.test(line)) {
          const desc   = clean(lines[i + 1] || "");
          const qtyStr = lines[i + 2] || "1";
          const totStr = lines[i + 3] || "0";
          const qty    = parseAmount(qtyStr) || 1;
          const tot    = parseAmount(totStr);
          if (desc && tot > 0) {
            items.push({ description: desc, quantity: qty, unit_price: parseFloat((tot / qty).toFixed(2)), total: tot });
            i += 4; continue;
          }
        }
        i++;
      }
    }

    // ── Totals ────────────────────────────────────────────────────────────
    const findAmountAfterLabel = (label: RegExp): number => {
      const idx = lines.findIndex(l => label.test(l));
      if (idx < 0) return 0;
      const sameLine = lines[idx].replace(label, "").trim();
      if (parseAmount(sameLine) > 0) return parseAmount(sameLine);
      return parseAmount(lines[idx + 1] || "0");
    };
    const subtotal = findAmountAfterLabel(/Total\s+Bruto/i)      || findAmountAfterLabel(/Base\s+[Gg]ravable/i);
    const taxTotal = findAmountAfterLabel(/IVA\s*\d+%?/i)        || findAmountAfterLabel(/Valor\s+IVA/i);
    const total    = findAmountAfterLabel(/Total\s+a\s+Pagar/i)   || findAmountAfterLabel(/Total\s+Factura/i);

    // ── CUFE ─────────────────────────────────────────────────────────────
    const cufeMatch = text.match(/CUFE[:\s]*([a-f0-9]{60,100})/i);
    const cufe = cufeMatch ? cufeMatch[1] : "";

    return NextResponse.json({
      success: true,
      data: {
        // Both issuer and client — page chooses which based on tab
        issuer_name:    issuerName,
        issuer_nit:     issuerNit,
        client_name:    clientName,
        client_nit:     clientNit,
        // Legacy field — page overrides with correct one
        supplier_name:  issuerName,
        document_number: issuerNit,
        invoice_number: invoiceNumber,
        cufe,
        issue_date:     issueDate,
        due_date:       dueDate,
        subtotal,
        tax_total:      taxTotal,
        total,
        items,
        raw_text_preview: text.slice(0, 3000),
        raw_lines_sample: lines.slice(0, 80),
      },
    });
  } catch (error: any) {
    console.error("PDF import error:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Error procesando PDF" }, { status: 500 });
  }
}
