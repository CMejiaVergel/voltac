import { NextResponse } from "next/server";

// ── Polyfill DOMMatrix for pdf-parse / pdfjs-dist in Node.js ──────────────
// pdfjs-dist uses DOMMatrix (a browser API) which doesn't exist in Node.js
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0;
    m11=1; m12=0; m13=0; m14=0;
    m21=0; m22=1; m23=0; m24=0;
    m31=0; m32=0; m33=1; m34=0;
    m41=0; m42=0; m43=0; m44=1;
    is2D=true; isIdentity=true;
    constructor(_init?: string | number[]) {}
    static fromMatrix(_o?: any)            { return new (globalThis as any).DOMMatrix(); }
    static fromFloat32Array(_a: Float32Array){ return new (globalThis as any).DOMMatrix(); }
    static fromFloat64Array(_a: Float64Array){ return new (globalThis as any).DOMMatrix(); }
    multiply(_o?: any)      { return this; }
    translate(_x=0,_y=0,_z=0){ return this; }
    scale()                 { return this; }
    rotate()                { return this; }
    flipX()                 { return this; }
    flipY()                 { return this; }
    inverse()               { return this; }
    transformPoint(_p?: any){ return { x:0, y:0, z:0, w:1 }; }
    toFloat32Array()        { return new Float32Array(16); }
    toFloat64Array()        { return new Float64Array(16); }
    toString()              { return "matrix(1, 0, 0, 1, 0, 0)"; }
  };
}

// ── Helper ────────────────────────────────────────────────────────────────
const clean  = (s: string) => s?.replace(/\s+/g, " ").trim() || "";
const parseAmount = (s: string) =>
  parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/\s/g, "")) || 0;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const pdfData  = await pdfParse(buffer);
    const text: string = pdfData.text || "";
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // ── NIT / Document number ─────────────────────────────────────────────
    // Siigo format: "NIT: 900.123.456-1" or "NIT 900123456-1"
    const nitMatch = text.match(/NIT[:\s#.]*([0-9]{3}[.\-]?[0-9]{3}[.\-]?[0-9]{3}[.\-]?[0-9])/i)
      || text.match(/N[úu]mero de identificaci[óo]n[:\s]*([0-9 .\-]{7,15})/i);
    const nit = nitMatch ? clean(nitMatch[1]).replace(/[.\s]/g, "") : "";

    // ── Supplier name ─────────────────────────────────────────────────────
    // Siigo places "Razón Social" or company name near the top after NIT
    const razonMatch = text.match(/Raz[óo]n Social[:\s]*([^\n]{5,80})/i)
      || text.match(/(?:Proveedor|Emisor|De:)[:\s]*([A-Z][^\n]{4,60})/i);
    // Fallback: look for patterns like "EMPRESA S.A.S" near NIT
    let supplierName = razonMatch ? clean(razonMatch[1]) : "";
    if (!supplierName) {
      const nitLineIdx = lines.findIndex(l => /NIT/i.test(l));
      if (nitLineIdx > 0) supplierName = clean(lines[nitLineIdx - 1]).slice(0, 80);
    }

    // ── Invoice number ────────────────────────────────────────────────────
    // Siigo electronic: "FEV-SETP24-3", "RV001", "FE-001", "FEV-000001"
    const numMatch = text.match(/(?:Factura[^\n]*N[°oú]?\.?|Número de Factura|Factura No\.?)[:\s]*([A-Z0-9\-]{3,25})/i)
      || text.match(/\b(FEV[-\s]?[A-Z0-9\-]{3,20})\b/i)
      || text.match(/\b(FE[-\s]?[A-Z0-9\-]{3,20})\b/i)
      || text.match(/\b(RV[0-9]{2,6})\b/i);
    const invoiceNumber = numMatch ? clean(numMatch[1]) : "";

    // ── CUFE (Colombian electronic invoice unique code) ───────────────────
    const cufeMatch = text.match(/CUFE[:\s]*([a-f0-9]{90,100})/i);
    const cufe = cufeMatch ? cufeMatch[1] : "";

    // ── Issue date ────────────────────────────────────────────────────────
    // Siigo: "Fecha de Emisión: 15/03/2025" or "2025-03-15"
    const dateMatch = text.match(/Fecha de [Ee]misi[óo]n[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
      || text.match(/Fecha[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
      || text.match(/(\d{4}-\d{2}-\d{2})/);
    let issueDate = "";
    if (dateMatch) {
      const raw = dateMatch[1];
      const parts = raw.split(/[\/\-]/);
      if (parts.length === 3) {
        const [a, b, c] = parts.map(Number);
        issueDate = a > 31
          ? `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`
          : `${c > 100 ? c : 2000+c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
      }
    }

    // ── Due date (Fecha de Vencimiento / Plazo) ───────────────────────────
    const dueMatch = text.match(/(?:Fecha de [Vv]enc|Vencimiento|Plazo)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    let dueDate = "";
    if (dueMatch) {
      const raw = dueMatch[1];
      const parts = raw.split(/[\/\-]/);
      if (parts.length === 3) {
        const [a, b, c] = parts.map(Number);
        dueDate = a > 31
          ? `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`
          : `${c > 100 ? c : 2000+c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
      }
    }

    // ── Totals ────────────────────────────────────────────────────────────
    // Siigo labels: "Total Factura", "TOTAL A PAGAR", "Valor Total"
    const totalMatch = text.match(/(?:Total Factura|TOTAL A PAGAR|Valor Total|TOTAL)[^\d$]*\$?\s*([\d.,\s]+)/i);
    const total = totalMatch ? parseAmount(totalMatch[1]) : 0;

    // Base gravable / Subtotal (before IVA)
    const baseMatch = text.match(/(?:Base [Gg]ravable|Subtotal|Sub[- ]total)[^\d$]*\$?\s*([\d.,\s]+)/i);
    const subtotal  = baseMatch ? parseAmount(baseMatch[1]) : 0;

    // IVA
    const ivaMatch  = text.match(/(?:IVA|Impuesto(?:[^\n]{0,30})?)[^\d$]*\$?\s*([\d.,\s]+)/i);
    const taxTotal  = ivaMatch  ? parseAmount(ivaMatch[1])  : (total > 0 && subtotal > 0 ? total - subtotal : 0);

    // ── Line items ────────────────────────────────────────────────────────
    // Siigo item rows: description + qty + unitPrice + total on same line
    const items: { description:string; quantity:number; unit_price:number; total:number }[] = [];
    const itemRegex = /^(.{5,60?}?)\s+(\d+(?:[.,]\d+)?)\s+([\d.,]+)\s+([\d.,]+)\s*$/gm;
    let m;
    while ((m = itemRegex.exec(text)) !== null) {
      const qty   = parseFloat(m[2].replace(",", ".")) || 1;
      const price = parseAmount(m[3]);
      const tot   = parseAmount(m[4]);
      if (price > 1000 && price < 1_000_000_000) { // sanity check: exclude small/huge values
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
    console.error("PDF import error:", error);
    return NextResponse.json({ success: false, error: error.message || "Error procesando PDF" }, { status: 500 });
  }
}
