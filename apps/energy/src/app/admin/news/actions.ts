"use server";

import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

// ── Compresión automática de imagen de portada ──
async function compressAndSaveCover(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);
  const uploadDir = join(process.cwd(), "uploads", "news");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = Date.now() + "-cover-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.(png|bmp|tiff?)$/i, ".jpg");
  const finalName = uniqueName.endsWith(".jpg") || uniqueName.endsWith(".jpeg") ? uniqueName : uniqueName.replace(/\.[^.]+$/, ".jpg");

  // Reescalar a max 1920px de ancho, calidad 80%, formato JPEG progresivo
  const compressed = await sharp(inputBuffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  await writeFile(join(uploadDir, finalName), compressed);
  return "/api/uploads/news/" + finalName;
}

// ── CRUD Actions ──

export async function createNewsEntry(formData: FormData) {
  try {
    const db = await getDB();
    const titulo = formData.get("titulo") as string;
    let slug = formData.get("slug") as string;
    const cuerpo = formData.get("cuerpo") as string;
    const keywords = formData.get("keywords") as string || "[]";
    const fuentes = formData.get("fuentes") as string || "";
    const estado = parseInt(formData.get("estado") as string || "0");
    const file = formData.get("file") as File | null;

    // Handle slug collisions
    let exist = await db.get("SELECT id FROM news_entries WHERE slug = ?", [slug]);
    let suffix = 2;
    let originalSlug = slug;
    while(exist) {
       slug = `${originalSlug}-${suffix}`;
       exist = await db.get("SELECT id FROM news_entries WHERE slug = ?", [slug]);
       suffix++;
    }

    let imagen_portada = null;
    if (file && file.size > 0) {
      imagen_portada = await compressAndSaveCover(file);
    }

    await db.run(
      `INSERT INTO news_entries (titulo, slug, cuerpo, imagen_portada, keywords, fuentes, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, slug, cuerpo, imagen_portada, keywords, fuentes, estado]
    );

    revalidatePath("/admin/news");
    revalidatePath("/noticias");
    revalidatePath("/");
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateNewsEntry(id: number, formData: FormData) {
  try {
    const db = await getDB();
    const titulo = formData.get("titulo") as string;
    const slug = formData.get("slug") as string;
    const cuerpo = formData.get("cuerpo") as string;
    const keywords = formData.get("keywords") as string || "[]";
    const fuentes = formData.get("fuentes") as string || "";
    const estado = parseInt(formData.get("estado") as string || "0");
    const file = formData.get("file") as File | null;

    // Reject if slug belongs to another ID
    let exist = await db.get("SELECT id FROM news_entries WHERE slug = ? AND id != ?", [slug, id]);
    if (exist) return { success: false, error: "El slug ya está en uso por otra entrada. Carga un slug diferente." };

    let imagen_portada = null;
    if (file && file.size > 0) {
      imagen_portada = await compressAndSaveCover(file);
    }

    if (imagen_portada) {
      await db.run(
        `UPDATE news_entries SET titulo = ?, slug = ?, cuerpo = ?, imagen_portada = ?, keywords = ?, fuentes = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        [titulo, slug, cuerpo, imagen_portada, keywords, fuentes, estado, id]
      );
    } else {
      await db.run(
        `UPDATE news_entries SET titulo = ?, slug = ?, cuerpo = ?, keywords = ?, fuentes = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
        [titulo, slug, cuerpo, keywords, fuentes, estado, id]
      );
    }

    revalidatePath("/admin/news");
    revalidatePath("/noticias");
    revalidatePath(`/noticias/${slug}`);
    revalidatePath("/");
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleNewsStatus(id: number, currentStatus: number) {
  const db = await getDB();
  const nextStatus = currentStatus === 1 ? 0 : 1;
  const entry = await db.get("SELECT slug FROM news_entries WHERE id = ?", [id]);
  
  await db.run("UPDATE news_entries SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?", [nextStatus, id]);
  revalidatePath("/admin/news");
  revalidatePath("/noticias");
  revalidatePath("/");
  if(entry?.slug) revalidatePath(`/noticias/${entry.slug}`);
  return { success: true };
}

export async function bulkToggleNewsStatus(ids: number[], publish: boolean) {
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.run(`UPDATE news_entries SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, [publish ? 1 : 0, ...ids]);
  
  revalidatePath("/admin/news");
  revalidatePath("/noticias");
  revalidatePath("/");
  return { success: true };
}

export async function deleteNewsEntry(id: number, pass: string) {
  if (pass !== "voltacenergy2026") return { success: false, error: "Contraseña incorrecta." };
  const db = await getDB();
  await db.run("DELETE FROM news_entries WHERE id = ?", [id]);
  revalidatePath("/admin/news");
  revalidatePath("/noticias");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteNewsEntries(ids: number[], pass: string) {
  if (pass !== "voltacenergy2026") return { success: false, error: "Contraseña incorrecta." };
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.run(`DELETE FROM news_entries WHERE id IN (${placeholders})`, [...ids]);
  revalidatePath("/admin/news");
  revalidatePath("/noticias");
  revalidatePath("/");
  return { success: true };
}

export async function getLatestNews() {
  const db = await getDB();
  const entries = await db.all("SELECT * FROM news_entries WHERE estado = 1 ORDER BY fecha_publicacion DESC LIMIT 3");
  return entries;
}
