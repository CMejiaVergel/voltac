import { NextResponse } from "next/server";

// ── Smart number parser: handles both US "1,234.56" and Colombian "1.234,56"
const parseAmount = (s: string): number => {
  if (!s) return 0;
  const t = s.replace(/\s/g, "");
  const lastDot = t.lastIndexOf(".");
  const lastComma = t.lastIndexOf(",");
  let n: string;
  if (lastDot > lastComma) n = t.replace(/,/g, "");          // US: remove commas
  else if (lastComma > lastDot) n = t.replace(/\./g, "").replace(",", "."); // CO: remove dots, comma→dot
  else n = t.replace(/,/g, "");
  return parseFloat(n) || 0;
};

const clean = (s: string) => s?.replace(/\s+/g, " ").trim() || "";

const toISO = (raw: string): string => {
  if (!raw || raw === "--" || raw === "—") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-]/);
  if (parts.length !== 3) return "";
  const [a, b, c] = parts.map(Number);
  if (a > 31) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
  return `${c > 100 ? c : 2000 + c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse v1.1.1 — uses pdfjs-dist v1.x which has NO browser API dependencies
    // This version reliably extracts text from browser-printed PDFs (iSiigo, Chrome print, etc.)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const pdfData  = await pdfParse(buffer);
    const text: string = pdfData.text || "";
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);

    // ── DEBUG: return raw text for first-time calibration ─────────────────
    // This allows us to see exactly what pdfjs extracts from this specific PDF
    if (lines.length === 0) {
      return NextResponse.json({
        success: false,
        error: "El PDF no tiene texto extraíble (posiblemente es una imagen escaneada). Cantidad de páginas: " + pdfData.numpages,
        raw_text_preview: text.slice(0, 500),
      }, { status: 422 });
    }

    // ── ISSUER (top section: company name + NIT) ───────────────────────────
    // iSiigo: "VOLTAC SYSTEMS SAS\nNIT 901.734.603-1\n..."
    const firstNitIdx = lines.findIndex((l: string) => /^NIT\b/i.test(l) || /^NIT\s+\d/i.test(l));
    let issuerName = "";
    let issuerNit  = "";
    if (firstNitIdx >= 0) {
      // Issuer name is 1-3 lines before the first NIT
      for (let i = Math.max(0, firstNitIdx - 3); i < firstNitIdx; i++) {
        const c = lines[i];
        if (c.length > 3 && !/^\d/.test(c) && !/fecha|tel:|email|correo|web|@/i.test(c)) {
          issuerName = c.slice(0, 100);
        }
      }
      // NIT value: same line or next line
      const nitLine = lines[firstNitIdx];
      const inlinePart = nitLine.replace(/^NIT\s*/i, "").trim();
      const rawNit = inlinePart || (lines[firstNitIdx + 1] || "");
      issuerNit = rawNit.replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
    }

    // ── CLIENT (after "Señores" keyword) ──────────────────────────────────
    const sIdx = lines.findIndex((l: string) => /^Se[ñn]ores?$/i.test(l));
    let clientName = "";
    let clientNit  = "";
    if (sIdx >= 0) {
      clientName = clean(lines[sIdx + 1] || "");
      // Find NIT label in the client section (next 12 lines)
      const clientSlice = lines.slice(sIdx + 1, sIdx + 15);
      const cNitIdx = clientSlice.findIndex((l: string) => /^NIT$/i.test(l));
      if (cNitIdx >= 0) {
        const rawNit = (clientSlice[cNitIdx + 1] || "").trim();
        clientNit = rawNit.replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
      }
    }

    // ── Invoice number ─────────────────────────────────────────────────────
    // iSiigo formats: "No. 1", "No.1", "Factura\nNo. 1"
    const numLineIdx = lines.findIndex((l: string) => /^No\.?\s*\d+$/i.test(l));
    let invoiceNumber = "";
    if (numLineIdx >= 0) {
      invoiceNumber = lines[numLineIdx].replace(/^No\.?\s*/i, "").trim();
    } else {
      const numMatch = text.match(/(?:Factura|N[°o])\.\s*(\d+)/i) ||
                       text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,20})\b/i);
      invoiceNumber = numMatch ? numMatch[1] : "";
    }

    // ── Dates ──────────────────────────────────────────────────────────────
    const findDateAfterLabel = (label: RegExp): string => {
      const idx = lines.findIndex((l: string) => label.test(l));
      if (idx < 0) return "";
      // Check same line first
      const sameLine = lines[idx].replace(label, "").trim();
      if (/\d/.test(sameLine)) return toISO(sameLine.match(/[\d\/\-]{6,10}/)?.[0] || "");
      // Then next lines
      for (let i = idx + 1; i <= idx + 3; i++) {
        const m = (lines[i] || "").match(/[\d]{4}-[\d]{2}-[\d]{2}|[\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4}/);
        if (m) return toISO(m[0]);
      }
      return "";
    };
    const issueDate = findDateAfterLabel(/Fecha\s+(?:elaboraci[oó]n|de\s+emisi[oó]n)/i)
      || findDateAfterLabel(/Fecha\s+de\s+inicio/i);
    const dueDate = findDateAfterLabel(/Fecha\s+de\s+[Vv]enc/i)
      || findDateAfterLabel(/Vencimiento/i);

    // ── Items: iSiigo column-per-line format ───────────────────────────────
    // Table header contains "Vr. Total" or "Valor Total"
    // Rows: [item_index, description, qty, total] — each on its own line
    const items: { description: string; quantity: number; unit_price: number; total: number }[] = [];
    const vrTotalIdx = lines.findIndex((l: string) => /Vr\.?\s*[Tt]otal|Valor\s+[Tt]otal/i.test(l));
    const endIdx = lines.findIndex((l: string, i: number) => i > vrTotalIdx && /Total\s+items?:/i.test(l));

    if (vrTotalIdx >= 0) {
      const stop = endIdx > vrTotalIdx ? endIdx : vrTotalIdx + 60;
      let i = vrTotalIdx + 1;
      while (i < stop) {
        // Item number: standalone integer
        if (/^\d+$/.test(lines[i])) {
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

    // ── Totals ─────────────────────────────────────────────────────────────
    const findAmt = (label: RegExp): number => {
      const idx = lines.findIndex((l: string) => label.test(l));
      if (idx < 0) return 0;
      const same = lines[idx].replace(label, "").trim();
      if (parseAmount(same) > 0) return parseAmount(same);
      return parseAmount(lines[idx + 1] || "0");
    };
    const subtotal = findAmt(/Total\s+Bruto/i)      || findAmt(/Base\s+[Gg]ravable/i);
    const taxTotal = findAmt(/IVA\s*\d+%?/i)         || findAmt(/Valor\s+IVA/i);
    const total    = findAmt(/Total\s+a\s+Pagar/i)   || findAmt(/Total\s+Factura/i) || findAmt(/^TOTAL$/i);

    return NextResponse.json({
      success: true,
      data: {
        issuer_name:    issuerName,
        issuer_nit:     issuerNit,
        client_name:    clientName,
        client_nit:     clientNit,
        // Legacy compat fields
        supplier_name:  issuerName,
        document_number: issuerNit,
        invoice_number: invoiceNumber,
        issue_date:     issueDate,
        due_date:       dueDate,
        subtotal,
        tax_total:      taxTotal,
        total,
        items,
        // Always return full debug text so regex can be tuned if needed
        raw_text_preview: text.slice(0, 4000),
        raw_lines_sample: lines.slice(0, 100),
      },
    });
  } catch (error: any) {
    console.error("PDF import error:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Error procesando PDF" }, { status: 500 });
  }
}
