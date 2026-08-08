import * as React from "react";
import { getDB } from "@/lib/db";
import ClientProyectos from "./ClientProyectos";

export const dynamic = 'force-dynamic';

export const metadata = {
  alternates: { canonical: '/proyectos' },
  title: "Trabajos entregados | Voltac Systems",
  description: "Casos reales de organizaciones que hoy dedican menos horas al mismo trabajo: qué les estaba costando tiempo, qué hicimos y qué cambió después.",
};

export default async function ProyectosPage() {
  const db = await getDB();
  const allProjects = await db.all("SELECT * FROM projects");
  const publishedProjects = allProjects.filter((p: any) => p.isPublished === 1).sort((a: any, b: any) => b.id - a.id);
  
  return <ClientProyectos projects={publishedProjects} />;
}
