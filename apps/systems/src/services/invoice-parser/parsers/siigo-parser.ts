import { ParsedInvoiceData } from "../validation/invoice-validation";
import { parseAmount, clean, toISO } from "./utils";

export function parseSiigoInvoice(text: string, lines: string[]): Partial<ParsedInvoiceData> {
  let issuerName = "";
  let issuerNit  = "";
  const firstNitIdx = lines.findIndex((l: string) => /^NIT\b/i.test(l));
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

  const sIdx = lines.findIndex((l: string) => /^Se[ñn]ores/i.test(l));
  let clientName = "";
  let clientNit  = "";
  if (sIdx >= 0) {
    const line = lines[sIdx];
    const sameLineMatch = line.match(/^Se[ñn]ores\s*(.+)/i);
    if (sameLineMatch && sameLineMatch[1].length > 3) {
      clientName = clean(sameLineMatch[1]).slice(0, 100);
    } else {
      for (let i = sIdx + 1; i <= sIdx + 3; i++) {
        const l = lines[i];
        if (l && l.length > 3 && !/^NIT|^Tel|^Dir/i.test(l)) {
          clientName = clean(l).slice(0, 100);
          break;
        }
      }
    }
    const clientSlice = lines.slice(sIdx, sIdx + 15);
    const cNitLine = clientSlice.find((l: string) => /^NIT/i.test(l));
    if (cNitLine) {
      const afterLabel = cNitLine.replace(/^NIT\s*/i, "").trim();
      const nitInLine = afterLabel.match(/([\d.\-]{6,20})/);
      if (nitInLine) {
        clientNit = nitInLine[1].replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
      } else {
        const cNitIdx = clientSlice.findIndex((l: string) => /^NIT/i.test(l));
        const nextLine = (clientSlice[cNitIdx + 1] || "").trim();
        clientNit = nextLine.replace(/[.\s]/g, "").match(/[\d-]{6,14}/)?.[0] || "";
      }
    }
  }

  let invoiceNumber = "";
  const numLineIdx = lines.findIndex((l: string) =>
    /^No\.?\s*[A-Z0-9\-]+\s*$/i.test(l) || /^N[°o]\s*[A-Z0-9\-]+\s*$/i.test(l)
  );
  if (numLineIdx >= 0) {
    invoiceNumber = lines[numLineIdx].replace(/^N[o°]\.?\s*/i, "").trim();
  } else {
    const numMatch =
      text.match(/(?:Factura[^\n]{0,20}?N[°oú]?\.?|N[uú]mero de Factura|No\. de Factura)[:\s#]*([A-Z0-9\-]{3,30})/i) ||
      text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,25})\b/i) ||
      text.match(/\b(RV[0-9]{2,6})\b/i) ||
      text.match(/\b(FE[-\s]?[A-Z0-9\-]{3,25})\b/i) ||
      text.match(/(?:Factura|N[°o])\.\s*([A-Z0-9\-]{3,25})/i);
    invoiceNumber = numMatch ? clean(numMatch[1]) : "";
  }

  const cufeMatch = text.match(/CUFE[:\s]*([a-f0-9]{60,100})/i);
  const cufe = cufeMatch ? cufeMatch[1] : "";

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

  const tableHeaderIdx = lines.findIndex((l: string) =>
    /Vr\.?\s*[Tt]otal/i.test(l) || /Vr\.?\s*[Uu]nitario/i.test(l) ||
    /Precio\s+[Uu]nitario/i.test(l) || /[ÍI]tem.*Descripci[oó]n/i.test(l)
  );
  const endIdx = lines.findIndex((l: string, i: number) =>
    i > tableHeaderIdx && /Total\s+items?:/i.test(l)
  );

  if (tableHeaderIdx >= 0) {
    const stop = endIdx > tableHeaderIdx ? endIdx : tableHeaderIdx + 60;
    let i = tableHeaderIdx + 1;
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

  if (items.length === 0) {
    const tableStart = Math.max(0, tableHeaderIdx + 1);
    const tableEnd = endIdx > tableStart ? endIdx : Math.min(lines.length, tableStart + 20);
    for (let i = tableStart; i < tableEnd; i++) {
      const line = lines[i];
      if (!line) break;
      if (/^Total\s+items?:|^Valor\s+en\s+Letras|^Condiciones/i.test(line)) break;

      const itemNumMatch = line.match(/^(\d+)/);
      if (!itemNumMatch) continue;

      const rest = line.slice(itemNumMatch[1].length);
      const totalMatch =
        rest.match(/([1-9]\d{0,2}(?:,\d{3})+\.\d{2})$/) ||
        rest.match(/([1-9]\d{0,2}(?:\.\d{3})+,\d{2})$/) ||
        rest.match(/([1-9]\d{0,6}(?:[.,]\d{2})?)$/);
      if (!totalMatch) continue;
      const total = parseAmount(totalMatch[1]);
      if (total <= 0) continue;

      const beforeTotal = rest.slice(0, rest.length - totalMatch[1].length).trim();
      const qtyMatch = beforeTotal.match(/(\d{1,4}(?:[.,]\d{2})?)\s*$/);
      if (qtyMatch) {
        const qty = parseAmount(qtyMatch[1]) || 1;
        const description = clean(beforeTotal.slice(0, beforeTotal.length - qtyMatch[0].length));
        if (description && total > 0) {
          items.push({
            description,
            quantity: qty,
            unit_price: parseFloat((total / qty).toFixed(2)),
            total
          });
        }
      } else {
        const description = clean(beforeTotal);
        if (description && total > 0) {
          items.push({ description, quantity: 1, unit_price: total, total });
        }
      }
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
    cufe,
    issue_date: issueDate,
    due_date: dueDate,
    subtotal,
    tax_total: taxTotal,
    total,
    items,
    currency: "COP"
  };
}
