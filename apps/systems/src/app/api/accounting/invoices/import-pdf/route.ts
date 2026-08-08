import { NextResponse } from "next/server";
import { parseInvoice } from "@/services/invoice-parser/invoice-parser.service";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "emitted" | "received" | null;
    const forceOCR = formData.get("forceOCR") === "true";
    const skipAI = formData.get("skipAI") === "true";

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await parseInvoice(buffer, {
      type: type || "emitted",
      forceOCR,
      skipAI
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "No se pudo extraer información del PDF",
        raw_text_preview: result.raw_text_preview 
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      validation: result.validation,
      metadata: result.metadata,
      raw_text_preview: result.raw_text_preview,
      raw_lines_sample: result.raw_lines_sample
    });

  } catch (error: any) {
    console.error("PDF import error:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Error procesando PDF" }, { status: 500 });
  }
}
