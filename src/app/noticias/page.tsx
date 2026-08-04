import * as React from "react";
import { getDB } from "@/lib/db";
import ClientNoticias from "./ClientNoticias";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Noticias y aprendizajes | Voltac Systems",
  description: "Lo que aprendemos en proyectos reales, explicado sin tecnicismos: qué se puede automatizar hoy en una empresa, qué todavía no conviene y cómo saber por dónde empezar.",
};

export default async function NoticiasPage() {
  const db = await getDB();
  const publishedNews = await db.all("SELECT * FROM news_entries WHERE estado = 1 ORDER BY fecha_publicacion DESC");
  
  return <ClientNoticias newsList={publishedNews} />;
}
