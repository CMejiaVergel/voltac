import { getDB } from "@/lib/db";
import NewsClient from "./client";

export const dynamic = 'force-dynamic';

export default async function NewsAdminPage() {
  const db = await getDB();
  const entries = await db.all("SELECT * FROM news_entries ORDER BY id DESC");

  const allTags = Array.from(new Set(entries.flatMap((e: any) => {
     try { return JSON.parse(e.keywords); } catch { return []; }
  })));

  return <NewsClient initialEntries={entries} allTags={allTags} />;
}
