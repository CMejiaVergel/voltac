import { ParsedInvoiceData } from "../validation/invoice-validation";
import { parseAmount, clean, toISO } from "./utils";

export function parseGenericInvoice(text: string, lines: string[]): Partial<ParsedInvoiceData> {
  const invMatch = text.match(/(?:Factura|Invoice|Receipt|FEV|Documento)[^\d\w]*([A-Z0-9\-]+)/i);
  const invoiceNumber = invMatch ? clean(invMatch[1]) : "";

  const nitMatch = text.match(/(?:NIT|RUT|C\.C\.|ID)[:\s]*([\d\.\-]+)/i);
  const nit = nitMatch ? clean(nitMatch[1]).replace(/[^\d\-]/g, "") : "";

  const dateMatch = text.match(/(?:Fecha|Date|Emisi[oó]n)[:\s]*([\d\/\-]+)/i);
  const issueDate = dateMatch ? toISO(dateMatch[1]) : "";

  const totalMatch = text.match(/(?:Total a Pagar|TOTAL|Total Amount|Gran Total)[:\s\$]*([\d\.,]+)/i);
  const total = totalMatch ? parseAmount(totalMatch[1]) : 0;

  const subtotalMatch = text.match(/(?:Subtotal|Sub-total|Valor Bruto|Base)[:\s\$]*([\d\.,]+)/i);
  const subtotal = subtotalMatch ? parseAmount(subtotalMatch[1]) : 0;

  const taxMatch = text.match(/(?:IVA|Tax|Impuesto)[:\s\$]*([\d\.,]+)/i);
  const taxTotal = taxMatch ? parseAmount(taxMatch[1]) : 0;

  let issuerName = "";
  // Simple heuristic: The first non-empty line could be the supplier name
  for (const line of lines) {
    if (line.length > 3 && !/^\d/.test(line) && !/factura|invoice|receipt/i.test(line)) {
      issuerName = line.slice(0, 100);
      break;
    }
  }

  return {
    invoice_number: invoiceNumber,
    client_nit: nit,
    issuer_name: issuerName,
    issuer_nit: nit, // Generally we extract one NIT and use it as issuer for generic received invoices
    supplier_name: issuerName,
    document_number: nit,
    issue_date: issueDate,
    total,
    subtotal,
    tax_total: taxTotal,
    currency: "COP",
    items: []
  };
}
