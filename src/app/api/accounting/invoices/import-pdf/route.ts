import { NextResponse } from "next/server";
import { extractText } from "unpdf";

// ── Helper ────────────────────────────────────────────────────────────────
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

    // unpdf handles all Node.js / Edge compatibility internally
    const buffer = await file.arrayBuffer();
    const { text: rawText } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = rawText || "";

    // ── NIT / Document number ─────────────────────────────────────────────
    // Siigo format: "NIT: 900.123.456-1" or "NIT 900.123.456-1"
    const nitMatch =
      text.match(/NIT[:\s#.]*([0-9]{3}[.\s]?[0-9]{3}[.\s]?[0-9]{3}[-\s]?[0-9])/i) ||
      text.match(/N[úu]mero de identificaci[óo]n[:\s]*([0-9 .\-]{7,15})/i);
    const nit = nitMatch ? clean(nitMatch[1]).replace(/[.\s]/g, "") : "";

    // ── Supplier / issuer name ────────────────────────────────────────────
    const razonMatch =
      text.match(/Raz[óo]n Social[:\s]*([^\n]{5,80})/i) ||
      text.match(/(?:Proveedor|Emisor|De:)[:\s]*([A-Z][^\n]{4,60})/i);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let supplierName = razonMatch ? clean(razonMatch[1]) : "";
    if (!supplierName) {
      const nitIdx = lines.findIndex((l) => /NIT/i.test(l));
      if (nitIdx > 0) supplierName = clean(lines[nitIdx - 1]).slice(0, 80);
    }

    // ── Invoice number ────────────────────────────────────────────────────
    // Siigo FEV: "FEV-SETP24-3", "FEV 001", "FE-001", "RV001"
    const numMatch =
      text.match(/(?:Factura[^\n]*N[°oú]?\.?|Número de Factura|Factura No\.?)[:\s#]*([A-Z0-9\-]{3,25})/i) ||
      text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,20})\b/i) ||
      text.match(/\b(FE[-\s]?[A-Z0-9\-]{3,20})\b/i) ||
      text.match(/\b(RV[0-9]{2,6})\b/i);
    const invoiceNumber = numMatch ? clean(numMatch[1]) : "";

    // ── CUFE ─────────────────────────────────────────────────────────────
    const cufeMatch = text.match(/CUFE[:\s]*([a-f0-9]{60,100})/i);
    const cufe = cufeMatch ? cufeMatch[1] : "";

    // ── Dates ─────────────────────────────────────────────────────────────
    const toISO = (raw: string): string => {
      const parts = raw.split(/[\/\-]/);
      if (parts.length !== 3) return "";
      const [a, b, c] = parts.map(Number);
      return a > 31
        ? `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`
        : `${c > 100 ? c : 2000 + c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    };

    const issueDateMatch =
      text.match(/Fecha de [Ee]misi[óo]n[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
      text.match(/Fecha[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
      text.match(/(\d{4}-\d{2}-\d{2})/);
    const issueDate = issueDateMatch ? toISO(issueDateMatch[1]) : "";

    const dueDateMatch = text.match(
      /(?:Fecha de [Vv]enc|Vencimiento|Plazo|Válido hasta)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    );
    const dueDate = dueDateMatch ? toISO(dueDateMatch[1]) : "";

    // ── Amounts ───────────────────────────────────────────────────────────
    const totalMatch = text.match(
      /(?:Total Factura|TOTAL A PAGAR|Valor Total|TOTAL)[^\d$]*\$?\s*([\d.,\s]{4,20})/i
    );
    const total = totalMatch ? parseAmount(totalMatch[1]) : 0;

    const baseMatch = text.match(
      /(?:Base [Gg]ravable|Subtotal|Sub[- ]total)[^\d$]*\$?\s*([\d.,\s]{4,20})/i
    );
    const subtotal = baseMatch ? parseAmount(baseMatch[1]) : 0;

    const ivaMatch = text.match(
      /(?:IVA|Impuesto(?:[^\n]{0,30})?)[^\d$]*\$?\s*([\d.,\s]{4,20})/i
    );
    const taxTotal =
      ivaMatch ? parseAmount(ivaMatch[1]) :
      total > 0 && subtotal > 0 ? total - subtotal : 0;

    // ── Line items ────────────────────────────────────────────────────────
    const items: { description: string; quantity: number; unit_price: number; total: number }[] = [];
    const itemRegex = /^(.{5,60?}?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]{4,20})\s+([\d.,]{4,20})\s*$/gm;
    let m;
    while ((m = itemRegex.exec(text)) !== null) {
      const qty   = parseFloat(m[2].replace(",", ".")) || 1;
      const price = parseAmount(m[3]);
      const tot   = parseAmount(m[4]);
      if (price > 1_000 && price < 1_000_000_000) {
        items.push({ description: clean(m[1]), quantity: qty, unit_price: price, total: tot || qty * price });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        supplier_name:   supplierName,
        document_number: nit,
        invoice_number:  invoiceNumber,
        cufe,
        issue_date:      issueDate,
        due_date:        dueDate,
        subtotal,
        tax_total:       taxTotal,
        total,
        items,
        raw_text_preview: text.slice(0, 800),
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
