import { extractTextFromPdf } from "./extractors/pdf-extractor";
import { extractTextWithOcr } from "./extractors/ocr-extractor";
import { parseSiigoInvoice } from "./parsers/siigo-parser";
import { parseGenericInvoice } from "./parsers/generic-parser";
import { validateInvoiceData, ParsedInvoiceData, ValidationResult } from "./validation/invoice-validation";
import { processWithAI } from "./ai-fallback.service";

export interface ParseOptions {
  forceOCR?: boolean;
  skipAI?: boolean;
  type?: "emitted" | "received";
}

export interface ParseResult {
  success: boolean;
  data?: Partial<ParsedInvoiceData>;
  validation?: ValidationResult;
  metadata?: {
    source: string;
    parser_used: string;
    confidence: number;
    processing_time_ms: number;
    ocr_activated: boolean;
    ai_activated: boolean;
  };
  error?: string;
  raw_text_preview?: string;
  raw_lines_sample?: string[];
}

export async function parseInvoice(buffer: Buffer, options: ParseOptions = {}): Promise<ParseResult> {
  const startTime = Date.now();
  let text = "";
  let ocrActivated = false;
  let aiActivated = false;
  let parserUsed = "none";

  // 1. PDF Extraction
  if (!options.forceOCR) {
    const pdfRes = await extractTextFromPdf(buffer);
    text = pdfRes.text;
  }

  // 1B. OCR Fallback
  if (options.forceOCR || text.length < 100 || !/factura|total|nit/i.test(text)) {
    ocrActivated = true;
    const ocrText = await extractTextWithOcr(buffer);
    if (ocrText) text = ocrText;
  }

  if (!text || text.length < 20) {
    return {
      success: false,
      error: "No se pudo extraer texto del PDF ni mediante OCR.",
      raw_text_preview: text.slice(0, 500)
    };
  }

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  // 2. Parse (Siigo vs Generic)
  let parsedData: Partial<ParsedInvoiceData>;
  if (/siigo/i.test(text) || options.type === "emitted") {
    parsedData = parseSiigoInvoice(text, lines);
    parserUsed = "siigo-regex";
  } else {
    parsedData = parseGenericInvoice(text, lines);
    parserUsed = "generic-regex";
  }

  // 3. Validation
  let validation = validateInvoiceData(parsedData, options.type || "emitted");

  // 4. AI Fallback
  if (!validation.isValid && !options.skipAI) {
    aiActivated = true;
    const aiData = await processWithAI(text, validation.missingFields);
    if (aiData) {
      parsedData = { ...parsedData, ...aiData };
      validation = validateInvoiceData(parsedData, options.type || "emitted");
      parserUsed += "+ai";
    }
  }

  const processingTime = Date.now() - startTime;
  
  return {
    success: true,
    data: parsedData,
    validation,
    metadata: {
      source: "upload",
      parser_used: parserUsed,
      confidence: validation.isValid ? (aiActivated ? 95 : 100) : 50,
      processing_time_ms: processingTime,
      ocr_activated: ocrActivated,
      ai_activated: aiActivated
    },
    raw_text_preview: text.slice(0, 3000),
    raw_lines_sample: lines.slice(0, 80)
  };
}
