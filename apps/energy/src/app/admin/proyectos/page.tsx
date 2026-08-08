import * as React from "react";
import { getDB } from "@/lib/db";
import ProjectsClient from "./client";

export const dynamic = 'force-dynamic';

export default async function AdminProyectosPage() {
  const db = await getDB();
  const projects = await db.all("SELECT * FROM projects ORDER BY id DESC");
  return <ProjectsClient initialProjects={projects} />;
}
