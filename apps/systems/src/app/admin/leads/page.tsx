import * as React from "react";
import { getDB } from "@/lib/db";
import { asistenteDisponible } from "@voltac/core/ia-assistant/cliente";
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

  /* Se resuelve en el servidor porque depende del entorno de la aplicación, no
     del navegador. Sin línea configurada el bloque de WhatsApp no se pinta:
     ofrecer un botón que solo puede fallar es peor que no ofrecerlo. Es lo que
     verá Energy hasta que tenga su propia línea. */
  return <LeadsClient initialLeads={leadsWithNotes} whatsappActivo={asistenteDisponible()} />;
}
