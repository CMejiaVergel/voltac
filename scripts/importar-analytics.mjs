#!/usr/bin/env node
/**
 * Importa el historial de analítica del formato anterior.
 *
 * Antes los eventos se anotaban como líneas JSON en `data/analytics_log.jsonl`.
 * Ese archivo no entraba en los respaldos y dejó de escribirse al migrar al
 * monorepo, pero contiene el historial real de visitas de Voltac Energy. Este
 * script lo pasa a la tabla `analytics_events` de la base de la vertical.
 *
 * Las IPs del archivo estaban en claro; al importarlas se convierten al mismo
 * hash con sal que usa la recolección actual, así que el histórico queda
 * anonimizado igual que lo nuevo y los visitantes únicos siguen cuadrando.
 *
 * Uso:
 *   VOLTAC_VERTICAL=energy VOLTAC_DATA_DIR=/var/www/voltac-data \
 *   node scripts/importar-analytics.mjs /var/www/voltac-energy/data/analytics_log.jsonl
 */

import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const archivo = process.argv[2];
const vertical = process.env.VOLTAC_VERTICAL;
const dataDir = resolve(process.env.VOLTAC_DATA_DIR ?? process.cwd());

if (!archivo || !vertical) {
  console.error("Uso: VOLTAC_VERTICAL=<systems|energy> VOLTAC_DATA_DIR=<ruta> node scripts/importar-analytics.mjs <archivo.jsonl>");
  process.exit(1);
}
if (!existsSync(archivo)) {
  console.error(`No existe ${archivo}. Nada que importar.`);
  process.exit(0);
}

const sal = process.env.ADMIN_SESSION_SECRET ?? "voltac";
const hashIp = (ip) => createHash("sha256").update(`${sal}:${ip}`).digest("hex").slice(0, 32);

const EVENTOS = new Set(["page_view", "time_spent", "click_cotizar"]);

const db = await open({ filename: join(dataDir, vertical, "voltac.db"), driver: sqlite3.Database });

const antes = (await db.get("SELECT COUNT(*) c FROM analytics_events")).c;

const lineas = (await readFile(archivo, "utf8")).split("\n").filter((l) => l.trim());
let importados = 0, descartados = 0;

await db.exec("BEGIN");
for (const linea of lineas) {
  try {
    const e = JSON.parse(linea);
    const evento = e.eventType ?? e.event;
    if (!EVENTOS.has(evento)) { descartados++; continue; }
    await db.run(
      `INSERT INTO analytics_events (at, event, path, ipHash, duration) VALUES (?, ?, ?, ?, ?)`,
      [
        e.timestamp ?? new Date().toISOString(),
        evento,
        String(e.path ?? "/").slice(0, 300),
        hashIp(String(e.ip ?? "desconocida")),
        Math.max(0, Number(e.duration) || 0),
      ],
    );
    importados++;
  } catch { descartados++; }
}
await db.exec("COMMIT");

const despues = (await db.get("SELECT COUNT(*) c FROM analytics_events")).c;
const rango = await db.get("SELECT MIN(date(at)) desde, MAX(date(at)) hasta FROM analytics_events");

console.log(`\nHistórico importado a ${vertical}`);
console.log(`  líneas leídas : ${lineas.length}`);
console.log(`  importadas    : ${importados}`);
console.log(`  descartadas   : ${descartados}`);
console.log(`  tabla: ${antes} → ${despues} eventos (${rango.desde} a ${rango.hasta})`);
console.log(`\nEl archivo original no se toca.\n`);

await db.close();
