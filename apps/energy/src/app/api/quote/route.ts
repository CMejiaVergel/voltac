import { uploadsDir, uploadsUrl } from "@voltac/core/paths";
import { currentVertical } from "@voltac/core/vertical";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";

/**
 * Alta de prospectos desde el formulario público de cotización.
 *
 * Este endpoint perdía prospectos en silencio. La modalidad exprés —la persona
 * sube la foto de su factura— fallaba con cualquier archivo de más de 10 MB,
 * que es el tamaño corriente de una foto de móvil: el proxy solo almacena los
 * primeros 10 MB del cuerpo, el multipart llegaba cortado, `formData()` lanzaba
 * y el catch devolvía un 500 que el formulario ni miraba.
 *
 * Tres reglas nuevas, en orden de importancia:
 *
 *  1. **El prospecto se guarda aunque el archivo falle.** Un nombre y un
 *     teléfono valen mucho más que el adjunto: sin la factura se puede llamar y
 *     pedirla; sin el contacto no hay nada.
 *  2. **Lo que no se pudo guardar se dice.** La respuesta lleva `fileSaved`, y
 *     el mensaje del prospecto anota que la factura no llegó, para que quien
 *     atienda el CRM la pida en la primera llamada.
 *  3. **Un fallo real devuelve un error real.** Nada de 200 optimistas.
 */

/** Ni la foto de una factura ni un PDF de recibo pasan de aquí. */
const MAX_ARCHIVO = 24 * 1024 * 1024;

const EXTENSIONES = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"]);

function extension(nombre: string): string {
  const punto = nombre.lastIndexOf(".");
  return punto === -1 ? "" : nombre.slice(punto + 1).toLowerCase();
}

export async function POST(req: Request) {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    /*
     * Aquí cae el cuerpo cortado. Antes se confundía con un fallo de base de
     * datos y el mensaje no ayudaba a nadie.
     */
    return NextResponse.json(
      {
        success: false,
        error:
          "No pudimos recibir el archivo completo. Intente con una foto más liviana o envíenos la factura por WhatsApp.",
        motivo: "cuerpo_incompleto",
      },
      { status: 413 },
    );
  }

  const texto = (campo: string) => {
    const v = formData.get(campo);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const modality = texto("modality") ?? "express";
  const fullName = texto("fullName");
  const phone = texto("phone");

  // Sin nombre ni teléfono no hay prospecto que registrar; con eso, sí.
  if (!fullName || !phone) {
    return NextResponse.json(
      { success: false, error: "Necesitamos su nombre y su número de contacto." },
      { status: 400 },
    );
  }

  const consumptionRaw = texto("consumption");
  const consumption = consumptionRaw !== null ? Number(consumptionRaw) : null;

  /*
   * El origen venía escrito a fuego como 'Web' y se ignoraba el que mandaba
   * cada formulario: el de contacto llevaba meses enviando "Web Contacto" para
   * nada. Distinguirlos es la base de poder medir qué página trae clientes, y
   * el punto de enganche de la futura ingesta multicanal.
   */
  const source = (texto("source") ?? "Web").slice(0, 40);

  let filePath: string | null = null;
  let archivoRecibido = false;
  let fallaArchivo: string | null = null;

  const file = formData.get("file");

  if (file instanceof File && file.size > 0 && file.name) {
    archivoRecibido = true;
    const ext = extension(file.name);

    if (file.size > MAX_ARCHIVO) {
      fallaArchivo = "demasiado_grande";
    } else if (!EXTENSIONES.has(ext)) {
      fallaArchivo = "formato_no_admitido";
    } else {
      try {
        const uploadDir = uploadsDir(currentVertical(), "quotes");
        await mkdir(uploadDir, { recursive: true });

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueName = `${Date.now()}-${safeName}`;
        await writeFile(join(uploadDir, uniqueName), Buffer.from(await file.arrayBuffer()));
        filePath = uploadsUrl("quotes", uniqueName);
      } catch (error) {
        // Se registra y se sigue: el prospecto no se pierde por un disco lleno
        // ni por un permiso mal puesto.
        console.error("[cotizacion] no se pudo guardar el adjunto:", error);
        fallaArchivo = "no_se_pudo_guardar";
      }
    }
  }

  const notas: string[] = [];
  const mensajeOriginal = texto("message");
  if (mensajeOriginal) notas.push(mensajeOriginal);
  if (fallaArchivo) {
    notas.push(
      `[Aviso automático] El cliente adjuntó su factura pero no se pudo conservar (${fallaArchivo}). Solicítela en el primer contacto.`,
    );
  }

  try {
    const database = await getDB();

    // Regla de negocio: la modalidad detallada entra con prioridad alta.
    const priority = modality === "detailed" ? "Alta" : "Media";

    await database.run(
      `INSERT INTO quotes (
        modality, fullName, phone, email, consumption, address, installType,
        location, objective, gridType, message, filePath, priority, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        modality,
        fullName,
        phone,
        texto("email"),
        Number.isFinite(consumption) ? consumption : null,
        texto("address"),
        texto("installType"),
        texto("location"),
        texto("objective"),
        texto("gridType"),
        notas.length ? notas.join("\n\n") : null,
        filePath,
        priority,
        source,
      ],
    );
  } catch (error) {
    console.error("[cotizacion] no se pudo registrar el prospecto:", error);
    return NextResponse.json(
      {
        success: false,
        error: "No pudimos registrar su solicitud. Escríbanos por WhatsApp y la atendemos de una vez.",
      },
      { status: 500 },
    );
  }

  revalidatePath("/admin/leads");

  return NextResponse.json({
    success: true,
    // El formulario lo usa para avisar de que la factura no quedó adjunta, sin
    // dar por fallida una solicitud que sí se registró.
    fileSaved: archivoRecibido ? filePath !== null : null,
  });
}
