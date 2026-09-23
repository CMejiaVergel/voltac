"use server";

import { getDB } from "@voltac/core/db";

/**
 * Alta de prospectos desde el formulario público.
 *
 * Esta línea todavía no monta el panel, así que no hay una pantalla donde
 * verlos. Aun así se guardan desde el primer día, en la base operativa de la
 * vertical `industry`: cuando el panel llegue, el histórico ya estará ahí.
 * Lo contrario —dejar el formulario apuntando a ninguna parte hasta que exista
 * el CRM— significa perder los prospectos de las primeras semanas, que son
 * justo los que cuesta más conseguir.
 *
 * La tabla `quotes` la crea el núcleo al abrir la base, con las columnas de la
 * línea de software. Es la que aplica aquí: este formulario pide empresa,
 * presupuesto y necesidad, no modalidad ni consumo como el de energía.
 */

export interface ProspectoNuevo {
  fullName?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  projectType?: unknown;
  budget?: unknown;
  requirement?: unknown;
  source?: unknown;
  stage?: unknown;
}

/** Devuelve el texto recortado, o `null` cuando el campo viene vacío. */
function texto(valor: unknown, maximo = 300): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, maximo) : null;
}

export async function crearProspecto(
  datos: ProspectoNuevo,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = texto(datos.fullName, 120);
  const email = texto(datos.email, 160);
  const phone = texto(datos.phone, 40);

  /*
   * `quotes.email` es NOT NULL en la definición del núcleo. Sin nombre y sin
   * una forma de responder no hay prospecto que registrar; con eso, sí.
   */
  if (!fullName || !email) {
    return { ok: false, error: "Necesitamos su nombre y su correo para poder responderle." };
  }

  try {
    const db = await getDB();
    await db.run(
      `INSERT INTO quotes
         (fullName, email, phone, company, budget, requirement, projectType, stage, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        phone,
        texto(datos.company, 160),
        texto(datos.budget, 40),
        texto(datos.requirement, 4000),
        texto(datos.projectType, 120),
        texto(datos.stage, 60) ?? "Nuevo Prospecto",
        "Pendiente de contacto",
        texto(datos.source, 40) ?? "Web",
      ],
    );
    return { ok: true };
  } catch (error) {
    console.error("[cotizar] no se pudo registrar el prospecto:", error);
    return {
      ok: false,
      error: "No pudimos registrar su solicitud. Escríbanos por WhatsApp y la atendemos de una vez.",
    };
  }
}
