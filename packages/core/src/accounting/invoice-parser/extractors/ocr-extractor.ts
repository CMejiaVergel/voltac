import { fromBuffer } from "pdf2pic";
import Tesseract from "tesseract.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function extractTextWithOcr(buffer: Buffer, maxPages = 3): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ocr-"));
  let extractedText = "";

  try {
    // pdf2pic requires Ghostscript installed on the host system.
    const options = {
      density: 300,
      saveFilename: "page",
      savePath: tempDir,
      format: "png",
      width: 2480,
      height: 3508
    };

    const storeAsImage = fromBuffer(buffer, options);
    
    // Tesseract worker
    const worker = await Tesseract.createWorker("spa");

    // Process up to maxPages
    for (let i = 1; i <= maxPages; i++) {
      try {
        const result = await storeAsImage(i, { responseType: "image" });
        if (result && result.path) {
          const { data: { text } } = await worker.recognize(result.path);
          extractedText += text + "\n\n";
        }
      } catch (err: any) {
        // May fail if page doesn't exist, stop
        if (err.message && err.message.includes("Page number")) break;
      }
    }

    await worker.terminate();

    // Clean common OCR errors
    extractedText = extractedText
      .replace(/\|/g, "I")
      .replace(/\]/g, "I")
      .replace(/\[/g, "I")
      .replace(/\{/g, "I")
      .replace(/\}/g, "I");

    return extractedText;
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return "";
  } finally {
    // Cleanup
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file));
      }
      await fs.rmdir(tempDir);
    } catch (e) {
      console.error("Cleanup error in OCR:", e);
    }
  }
}
