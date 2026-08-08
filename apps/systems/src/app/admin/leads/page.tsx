import * as React from "react";
import { getDB } from "@/lib/db";
import LeadsClient from "./LeadsClient";

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const db = await getDB();
  
  const leads = await db.all('SELECT * FROM quotes WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY id DESC');
  const allNotes = await db.all('SELECT * FROM notes ORDER BY id DESC');
  
  const notesMap: Record<number, any[]> = {};
  for (const n of allNotes) {
    if (!notesMap[n.quoteId]) notesMap[n.quoteId] = [];
    notesMap[n.quoteId].push(n);
  }

  const leadsWithNotes = leads.map(l => ({ ...l, notes: notesMap[l.id] || [] }));

  return <LeadsClient initialLeads={leadsWithNotes} />;
}
