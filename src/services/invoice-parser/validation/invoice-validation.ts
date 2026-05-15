export interface ParsedInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  client_nit: string;
  client_email?: string;
  supplier_name?: string; 
  document_number?: string; 
  issuer_name?: string;
  issuer_nit?: string;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_id?: string;
    discount_pct?: number;
  }>;
  cufe?: string;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

export function validateInvoiceData(data: Partial<ParsedInvoiceData>, type: "emitted" | "received" = "emitted"): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!data.invoice_number) missingFields.push("invoice_number");
  if (!data.total || data.total <= 0) missingFields.push("total");
  
  if (type === "emitted" && !data.client_name && !data.client_nit) missingFields.push("client_name_or_nit");
  if (type === "received" && !data.issuer_name && !data.issuer_nit) missingFields.push("issuer_name_or_nit");

  const isValid = missingFields.length === 0;

  if (!data.issue_date) warnings.push("Falta fecha de emisión");
  
  const calculatedTotal = (data.subtotal || 0) + (data.tax_total || 0);
  if (Math.abs(calculatedTotal - (data.total || 0)) > 2) {
    warnings.push("Los montos de subtotal e IVA no suman el total");
  }
  
  if (!data.items || data.items.length === 0) warnings.push("No se detectaron ítems");

  return { isValid, missingFields, warnings };
}
