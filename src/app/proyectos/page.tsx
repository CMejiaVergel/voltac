import * as React from "react";
import { getDB } from "@/lib/db";
import ClientProyectos from "./ClientProyectos";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Portafolio y Proyectos | Voltac Systems",
  description: "Portafolio tech construido por Voltac: Interfaces Inteligentes, Agentes IA B2B y Desarrollo de Software escalable.",
};

export default async function ProyectosPage() {
  const db = await getDB();
  const allProjects = await db.all("SELECT * FROM projects");
  const publishedProjects = allProjects.filter((p: any) => p.isPublished === 1).sort((a: any, b: any) => b.id - a.id);
  
  return <ClientProyectos projects={publishedProjects} />;
}
