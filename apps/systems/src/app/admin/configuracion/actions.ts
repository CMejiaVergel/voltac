"use server";


import { confirmarAccionSensible } from "@voltac/core/confirmar";
import { getDB } from "@/lib/db";

export async function getDeletedLeads(pass: string) {
  const confirmacion = await confirmarAccionSensible(pass, "ver_papelera");
  if (!confirmacion.ok) return { success: false, error: confirmacion.error };
  
  const db = await getDB();
  const leads = await db.all('SELECT * FROM quotes WHERE isDeleted = 1 ORDER BY id DESC');
  
  return { success: true, data: leads };
}
