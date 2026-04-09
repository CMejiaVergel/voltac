"use server";

import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

// ── Compresión automática de imagen de portada ──
async function compressAndSaveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);
  const uploadDir = join(process.cwd(), "uploads", "projects");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = Date.now() + "-project-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.(png|bmp|tiff?)$/i, ".jpg");
  const finalName = uniqueName.endsWith(".jpg") || uniqueName.endsWith(".jpeg") ? uniqueName : uniqueName.replace(/\.[^.]+$/, ".jpg");

  const compressed = await sharp(inputBuffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  await writeFile(join(uploadDir, finalName), compressed);
  return "/api/uploads/projects/" + finalName;
}

export async function getProjects() {
  const db = await getDB();
  return db.all('SELECT * FROM projects ORDER BY createdAt DESC');
}

export async function getPublishedProjects() {
  const db = await getDB();
  return db.all('SELECT * FROM projects WHERE isPublished = 1 ORDER BY createdAt DESC');
}

export async function toggleProjectStatus(id: number, currentStatus: boolean) {
  const db = await getDB();
  await db.run('UPDATE projects SET isPublished = ? WHERE id = ?', [currentStatus ? 0 : 1, id]);
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}

export async function deleteProject(id: number) {
  const db = await getDB();
  await db.run('DELETE FROM projects WHERE id = ?', [id]);
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}

export async function createProject(formData: FormData) {
  const db = await getDB();
  const title = formData.get("title") as string;
  const techType = formData.get("techType") as string;
  const challenge = formData.get("challenge") as string;
  const solution = formData.get("solution") as string;
  const metrics = formData.get("metrics") as string || "[]";
  const gallery = formData.get("gallery") as string || "[]";
  const isPublished = formData.get("isPublished") === "true";
  const file = formData.get("file") as File | null;

  let imageUrl = '/Voltac_enviroment.png';
  if (file && file.size > 0) {
    imageUrl = await compressAndSaveImage(file);
  }

  await db.run(
    `INSERT INTO projects (title, techType, challenge, solution, metrics, imageUrl, gallery, isPublished) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, techType, challenge, solution, metrics, imageUrl, gallery, isPublished ? 1 : 0]
  );
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}

export async function updateProject(id: number, formData: FormData) {
  const db = await getDB();
  const title = formData.get("title") as string;
  const techType = formData.get("techType") as string;
  const challenge = formData.get("challenge") as string;
  const solution = formData.get("solution") as string;
  const metrics = formData.get("metrics") as string || "[]";
  const gallery = formData.get("gallery") as string || "[]";
  const isPublished = formData.get("isPublished") === "true";
  const file = formData.get("file") as File | null;

  let imageUrl = formData.get("existingImageUrl") as string;
  if (!imageUrl) imageUrl = '/Voltac_enviroment.png';
  
  if (file && file.size > 0) {
    imageUrl = await compressAndSaveImage(file);
  }

  await db.run(
    `UPDATE projects SET 
      title = ?, techType = ?, challenge = ?, solution = ?, metrics = ?, 
      imageUrl = ?, gallery = ?, isPublished = ?
     WHERE id = ?`,
    [title, techType, challenge, solution, metrics, imageUrl, gallery, isPublished ? 1 : 0, id]
  );
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}
