"use server";

import { getDB } from "@/lib/db";

export async function getDeletedLeads(pass: string) {
  if (pass !== "voltacenergy2026") {
    return { success: false, error: "Contraseña administrativa incorrecta." };
  }
  
  const db = await getDB();
  const leads = await db.all('SELECT * FROM quotes WHERE isDeleted = 1 ORDER BY id DESC');
  
  return { success: true, data: leads };
}
