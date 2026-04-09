"use server";

import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function createProject(data: any) {
  const db = await getDB();
  const metricsJson = JSON.stringify(data.metrics || []);
  const galleryJson = JSON.stringify(data.gallery || []);

  await db.run(
    `INSERT INTO projects (title, techType, challenge, solution, metrics, imageUrl, gallery, isPublished) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title, data.techType, data.challenge, data.solution, metricsJson,
      data.imageUrl || '/Voltac_enviroment.png', galleryJson, data.isPublished ? 1 : 0
    ]
  );
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}

export async function updateProject(id: number, data: any) {
  const db = await getDB();
  const metricsJson = JSON.stringify(data.metrics || []);
  const galleryJson = JSON.stringify(data.gallery || []);

  await db.run(
    `UPDATE projects SET 
      title = ?, techType = ?, challenge = ?, solution = ?, metrics = ?, 
      imageUrl = ?, gallery = ?, isPublished = ?
     WHERE id = ?`,
    [
      data.title, data.techType, data.challenge, data.solution, metricsJson,
      data.imageUrl, galleryJson, data.isPublished ? 1 : 0, id
    ]
  );
  revalidatePath('/admin/proyectos');
  revalidatePath('/proyectos');
}
