import { NextResponse } from "next/server";
import { parseInvoice } from "../../../../accounting/invoice-parser/invoice-parser.service";
import { getDB } from "../../../../db";

function normalizeNit(nit: string): string {
  return nit.replace(/[.\s-]/g, "").toLowerCase();
}

async function resolveThirdParty(
  type: "emitted" | "received",
  name: string,
  nit: string
): Promise<{ id: number; name: string; createdAt: boolean }> {
  const db = await getDB();
  const table = type === "emitted" ? "acc_clients" : "acc_suppliers";
  const rawNit = normalizeNit(nit);

  // 1. Search by normalized NIT
  if (rawNit) {
    const all = await db.all(`SELECT * FROM ${table} WHERE is_active = 1`);
    const match = all.find((r: any) => r.document_number && normalizeNit(r.document_number) === rawNit);
    if (match) return { id: match.id, name: match.name, createdAt: false };
  }

  // 2. Search by normalized name
  const normalizedName = name?.toLowerCase().trim();
  if (normalizedName && normalizedName.length > 3) {
    const all = await db.all(`SELECT * FROM ${table} WHERE is_active = 1`);
    const match = all.find((r: any) => r.name?.toLowerCase().trim() === normalizedName);
    if (match) return { id: match.id, name: match.name, createdAt: false };
  }

  // 3. Auto-create with available data
  const result = await db.run(
    `INSERT INTO ${table} (name, document_type, document_number, is_active) VALUES (?, ?, ?, 1)`,
    [name?.trim() || "Tercero sin nombre", "NIT", nit?.replace(/[.\s-]/g, "") || "",]
  );
  return { id: result.lastID!, name: name?.trim() || "Tercero sin nombre", createdAt: true };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "emitted" | "received" | null;
    const forceOCR = formData.get("forceOCR") === "true";
    const skipAI = formData.get("skipAI") === "true";
    const resolvedType = type || "emitted";

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Se requiere un archivo PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await parseInvoice(buffer, {
      type: resolvedType,
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

    const data = result.data || {};

    // Resolve third party based on invoice type
    let thirdPartyId: number | null = null;
    let thirdPartyName: string | null = null;
    let thirdPartyCreated = false;

    if (resolvedType === "emitted") {
      const name = data.client_name || data.supplier_name || "";
      const nit  = data.client_nit || "";
      if (name || nit) {
        const resolved = await resolveThirdParty("emitted", name, nit);
        thirdPartyId = resolved.id;
        thirdPartyName = resolved.name;
        thirdPartyCreated = resolved.createdAt;
      }
    } else {
      const name = data.issuer_name || data.supplier_name || "";
      const nit  = data.issuer_nit || "";
      if (name || nit) {
        const resolved = await resolveThirdParty("received", name, nit);
        thirdPartyId = resolved.id;
        thirdPartyName = resolved.name;
        thirdPartyCreated = resolved.createdAt;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        third_party_id: thirdPartyId ? String(thirdPartyId) : "",
        third_party_name: thirdPartyName,
        third_party_created: thirdPartyCreated,
      },
      validation: result.validation,
      metadata: result.metadata,
      raw_text_preview: result.raw_text_preview,
      raw_lines_sample: result.raw_lines_sample,
    });

  } catch (error: any) {
    console.error("PDF import error:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Error procesando PDF" }, { status: 500 });
  }
}
