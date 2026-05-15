// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string, numPages: number }> {
  try {
    const pdfData = await pdfParse(buffer);
    return {
      text: pdfData.text || "",
      numPages: pdfData.numpages || 1
    };
  } catch (error) {
    console.error("Error in PDF extraction (pdf-parse):", error);
    return { text: "", numPages: 0 };
  }
}
