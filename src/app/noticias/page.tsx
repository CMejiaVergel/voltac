import * as React from "react";
import { getDB } from "@/lib/db";
import ClientNoticias from "./ClientNoticias";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Blog Técnico y Artículos | Voltac Systems",
  description: "Explora artículos sobre Inteligencia Artificial B2B, Ingeniería Serveless y Transformación Digital.",
};

export default async function NoticiasPage() {
  const db = await getDB();
  const publishedNews = await db.all("SELECT * FROM news_entries WHERE estado = 1 ORDER BY fecha_publicacion DESC");
  
  return <ClientNoticias newsList={publishedNews} />;
}
