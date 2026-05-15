import { ParsedInvoiceData } from "../validation/invoice-validation";
import { parseAmount, clean, toISO } from "./utils";

export function parseSiigoInvoice(text: string, lines: string[]): Partial<ParsedInvoiceData> {
  let issuerName = "";
  let issuerNit  = "";
  const firstNitIdx = lines.findIndex((l: string) => /^NIT\b/i.test(l) || /^NIT\s+\d/i.test(l));
  if (firstNitIdx >= 0) {
    for (let i = Math.max(0, firstNitIdx - 3); i < firstNitIdx; i++) {
      const c = lines[i];
      if (c.length > 3 && !/^\d/.test(c) && !/fecha|tel:|email|correo|web|@/i.test(c)) {
        issuerName = c.slice(0, 100);
      }
    }
    const nitLine = lines[firstNitIdx];
    const inlinePart = nitLine.replace(/^NIT\s*/i, "").trim();
    const rawNit = inlinePart || (lines[firstNitIdx + 1] || "");
    issuerNit = rawNit.replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
  }

  const sIdx = lines.findIndex((l: string) => /^Se[ñn]ores?$/i.test(l));
  let clientName = "";
  let clientNit  = "";
  if (sIdx >= 0) {
    clientName = clean(lines[sIdx + 1] || "");
    const clientSlice = lines.slice(sIdx + 1, sIdx + 15);
    const cNitIdx = clientSlice.findIndex((l: string) => /^NIT$/i.test(l));
    if (cNitIdx >= 0) {
      const rawNit = (clientSlice[cNitIdx + 1] || "").trim();
      clientNit = rawNit.replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
    }
  }

  const numLineIdx = lines.findIndex((l: string) => /^No\.?\s*\d+$/i.test(l));
  let invoiceNumber = "";
  if (numLineIdx >= 0) {
    invoiceNumber = lines[numLineIdx].replace(/^No\.?\s*/i, "").trim();
  } else {
    const numMatch = text.match(/(?:Factura|N[°o])\.\s*(\d+)/i) ||
                     text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,20})\b/i);
    invoiceNumber = numMatch ? numMatch[1] : "";
  }

  const findDateAfterLabel = (label: RegExp): string => {
    const idx = lines.findIndex((l: string) => label.test(l));
    if (idx < 0) return "";
    const sameLine = lines[idx].replace(label, "").trim();
    if (/\d/.test(sameLine)) return toISO(sameLine.match(/[\d\/\-]{6,10}/)?.[0] || "");
    for (let i = idx + 1; i <= idx + 3; i++) {
      const m = (lines[i] || "").match(/[\d]{4}-[\d]{2}-[\d]{2}|[\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4}/);
      if (m) return toISO(m[0]);
    }
    return "";
  };
  const issueDate = findDateAfterLabel(/Fecha\s+(?:elaboraci[oó]n|de\s+emisi[oó]n)/i) || findDateAfterLabel(/Fecha\s+de\s+inicio/i);
  const dueDate = findDateAfterLabel(/Fecha\s+de\s+[Vv]enc/i) || findDateAfterLabel(/Vencimiento/i);

  const items: any[] = [];
  const vrTotalIdx = lines.findIndex((l: string) => /Vr\.?\s*[Tt]otal|Valor\s+[Tt]otal/i.test(l));
  const endIdx = lines.findIndex((l: string, i: number) => i > vrTotalIdx && /Total\s+items?:/i.test(l));

  if (vrTotalIdx >= 0) {
    const stop = endIdx > vrTotalIdx ? endIdx : vrTotalIdx + 60;
    let i = vrTotalIdx + 1;
    while (i < stop) {
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

  const findAmt = (label: RegExp): number => {
    const idx = lines.findIndex((l: string) => label.test(l));
    if (idx < 0) return 0;
    const same = lines[idx].replace(label, "").trim();
    if (parseAmount(same) > 0) return parseAmount(same);
    return parseAmount(lines[idx + 1] || "0");
  };
  const subtotal = findAmt(/Total\s+Bruto/i) || findAmt(/Base\s+[Gg]ravable/i);
  const taxTotal = findAmt(/IVA\s*\d+%?/i) || findAmt(/Valor\s+IVA/i);
  const total    = findAmt(/Total\s+a\s+Pagar/i) || findAmt(/Total\s+Factura/i) || findAmt(/^TOTAL$/i);

  return {
    issuer_name: issuerName,
    issuer_nit: issuerNit,
    client_name: clientName,
    client_nit: clientNit,
    supplier_name: issuerName,
    document_number: issuerNit,
    invoice_number: invoiceNumber,
    issue_date: issueDate,
    due_date: dueDate,
    subtotal,
    tax_total: taxTotal,
    total,
    items,
    currency: "COP"
  };
}
