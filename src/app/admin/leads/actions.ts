"use server";

import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { adminConfig, safeEqual, sha256Hex } from "@/lib/auth";

/**
 * Segunda confirmacion para las acciones destructivas. Antes comparaba contra
 * una cadena escrita en el codigo —publicada, por tanto, en el repositorio—.
 * Ahora se valida contra el mismo hash del entorno que usa el login.
 */
async function confirmarClaveAdmin(pass: string): Promise<{ ok: boolean; error?: string }> {
  const config = adminConfig();
  if (!config) return { ok: false, error: "El acceso administrativo no esta configurado en el servidor." };
  const ok = safeEqual(await sha256Hex(pass ?? ""), config.passwordHash);
  return ok ? { ok: true } : { ok: false, error: "Contrasena administrativa incorrecta." };
}

export async function updateLeadStage(id: number, stage: string, status: string, author: string = "Admin") {
  const db = await getDB();
  
  await db.run(
    `UPDATE quotes SET stage = ?, status = ? WHERE id = ?`,
    [stage, status, id]
  );

  await db.run(
    `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 1)`,
    [id, `Lead cambiado a etapa: ${stage} (Estado: ${status})`, author]
  );

  revalidatePath('/admin/leads');
}

export async function updateLead(id: number, data: any, author: string = "Admin") {
  const db = await getDB();
  
  // Calculate differences to note
  const oldLead = await db.get(`SELECT * FROM quotes WHERE id = ?`, [id]);
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const fields = ['stage', 'status', 'followUpDate', 'priority', 'tags', 'assignedTo', 'projectType', 'fullName', 'phone', 'email', 'company', 'budget', 'requirement'];
  
  let changesDesc = [];
  for (const f of fields) {
    if (data[f] !== undefined && data[f] !== oldLead[f]) {
      updates.push(`${f} = ?`);
      values.push(data[f]);
      changesDesc.push(`${f}: '${oldLead[f] || ''}' -> '${data[f] || ''}'`);
    }
  }

  if (updates.length > 0) {
    values.push(id);
    await db.run(`UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`, values);
    
    await db.run(
      `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 1)`,
      [id, `Lead editado manualmente.\nCambios: ${changesDesc.join(', ')}`, author]
    );
    
    // Auto status update logic
    if (data.stage === 'Contactado' && oldLead.stage !== 'Contactado' && !data.status) {
      await db.run(`UPDATE quotes SET status = 'Esperando respuesta' WHERE id = ?`, [id]);
    }
  }
  
  revalidatePath('/admin/leads');
}

export async function addNote(quoteId: number, content: string, author: string = "Admin") {
  const db = await getDB();
  await db.run(
    `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 0)`,
    [quoteId, content, author]
  );
  revalidatePath('/admin/leads');
}

export async function createManualLead(data: any, author: string = "Admin") {
  const db = await getDB();
  
  const priority = data.modality === 'detallada' ? 'Alta' : (data.priority || 'Media');
  
  const result = await db.run(
    `INSERT INTO quotes (
      fullName, phone, email, projectType, message, requirement, company, budget,
      stage, status, priority, assignedTo, followUpDate, tags, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fullName, data.phone, data.email || null, data.projectType || null, data.message || null, data.requirement || null, data.company || null, data.budget || null,
      data.stage || 'Nuevo Prospecto', data.status || 'Pendiente de contacto', priority, data.assignedTo || null, data.followUpDate || null, 
      data.tags || '[]', data.source || 'Manual'
    ]
  );

  const newId = result.lastID;

  if (data.note) {
    await db.run(
      `INSERT INTO notes (quoteId, content, author, isSystem) VALUES (?, ?, ?, 0)`,
      [newId, data.note, author]
    );
  }

  revalidatePath('/admin/leads');
  return newId;
}

export async function deleteLeads(ids: number[], pass: string) {
  const check = await confirmarClaveAdmin(pass);
  if (!check.ok) return { success: false, error: check.error };
  
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  
  // Soft Delete Instead of Hard Delete
  await db.run(`UPDATE quotes SET isDeleted = 1 WHERE id IN (${placeholders})`, ids);
  
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function restoreLeads(ids: number[]) {
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.run(`UPDATE quotes SET isDeleted = 0 WHERE id IN (${placeholders})`, ids);
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function permanentDeleteLeads(ids: number[], pass: string) {
  const check = await confirmarClaveAdmin(pass);
  if (!check.ok) return { success: false, error: check.error };
  
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  
  await db.run(`DELETE FROM notes WHERE quoteId IN (${placeholders})`, ids);
  await db.run(`DELETE FROM quotes WHERE id IN (${placeholders})`, ids);
  
  revalidatePath('/admin/settings');
  return { success: true };
}
