import axios from "axios";
import { ParsedInvoiceData } from "./validation/invoice-validation";

export async function processWithAI(text: string, missingFields: string[]): Promise<Partial<ParsedInvoiceData> | null> {
  const N8N_WEBHOOK_URL = process.env.N8N_INVOICE_WEBHOOK_URL;
  if (!N8N_WEBHOOK_URL) {
    console.log("No n8n webhook URL configured. Skipping AI fallback.");
    return null;
  }

  const truncatedText = text.slice(0, 2000);
  
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      cleaned_text: truncatedText,
      missing_fields: missingFields
    }, { timeout: 10000 });

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error calling n8n AI webhook:", error);
    return null;
  }
}
