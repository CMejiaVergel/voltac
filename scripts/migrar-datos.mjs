#!/usr/bin/env node
/**
 * Migración a la estructura de datos del monorepo.
 *
 * De esto:                          A esto:
 *   voltac-systems/voltac.db          DATA_DIR/contabilidad.db      (empresa)
 *   voltac-energy/voltac.db           DATA_DIR/systems/voltac.db    (marca)
 *   voltac-systems/uploads/           DATA_DIR/energy/voltac.db     (marca)
 *   voltac-energy/uploads/            DATA_DIR/uploads/systems|energy/
 *
 * Por qué separar en vez de fusionar: la contabilidad es de la empresa —una
 * sola sociedad, un solo libro— pero los prospectos y el contenido son de cada
 * marca. Manteniendo bases operativas distintas, que el panel de una marca vea
 * los datos de la otra deja de depender de recordar un `WHERE` en noventa
 * consultas: es imposible, porque esas filas no están en el archivo abierto.
 *
 * El script NO destruye nada: copia. Los archivos originales quedan intactos
 * hasta que usted los borre a mano, después de verificar.
 *
 * Uso:
 *   node scripts/migrar-datos.mjs --revisar     (no escribe: solo informa)
 *   node scripts/migrar-datos.mjs --ejecutar
 */

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { mkdirSync, existsSync, cpSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MODO = process.argv.includes("--ejecutar") ? "ejecutar" : "revisar";

const DATA_DIR = resolve(process.env.VOLTAC_DATA_DIR ?? "/var/www/voltac-data");
const ORIGEN_SYSTEMS = resolve(process.env.ORIGEN_SYSTEMS ?? "/var/www/voltac-systems");
const ORIGEN_ENERGY = resolve(process.env.ORIGEN_ENERGY ?? "/var/www/voltac-energy");

const log = (...a) => console.log(...a);
const paso = (t) => log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

/** Tablas que pertenecen a la empresa, no a la línea de negocio. */
const esContable = (nombre) => nombre.startsWith("acc_");

async function abrir(archivo) {
  return open({ filename: archivo, driver: sqlite3.Database });
}

async function inventario(archivo) {
  if (!existsSync(archivo)) return null;
  const db = await abrir(archivo);
  const tablas = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const conteo = {};
  for (const { name } of tablas) {
    const r = await db.get(`SELECT COUNT(*) c FROM "${name}"`);
    conteo[name] = r.c;
  }
  await db.close();
  return conteo;
}

async function copiarTablas(origen, destino, filtro) {
  const src = await abrir(origen);
  await src.exec(`ATTACH DATABASE '${destino.replace(/'/g, "''")}' AS dest`);

  const tablas = (
    await src.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  ).filter((t) => filtro(t.name));

  let filas = 0;
  for (const t of tablas) {
    // Se recrea la tabla en el destino con su definición original.
    const ddl = t.sql.replace(
      new RegExp(`CREATE TABLE\\s+"?${t.name}"?`, "i"),
      `CREATE TABLE IF NOT EXISTS dest."${t.name}"`,
    );
    await src.exec(ddl);
    await src.exec(`INSERT INTO dest."${t.name}" SELECT * FROM main."${t.name}"`);
    const r = await src.get(`SELECT COUNT(*) c FROM dest."${t.name}"`);
    filas += r.c;
    log(`   ${t.name.padEnd(24)} ${String(r.c).padStart(5)} filas`);
  }

  // Índices y disparadores asociados
  const extras = await src.all(
    "SELECT sql, tbl_name FROM sqlite_master WHERE type IN ('index','trigger') AND sql IS NOT NULL",
  );
  for (const e of extras) {
    if (!filtro(e.tbl_name)) continue;
    try {
      await src.exec(e.sql.replace(/CREATE (UNIQUE )?INDEX /i, "CREATE $1INDEX IF NOT EXISTS dest_"));
    } catch {
      /* un índice que no se puede recrear no justifica abortar la migración */
    }
  }

  await src.exec("DETACH DATABASE dest");
  await src.close();
  return filas;
}

async function main() {
  log(`\nMigración de datos · modo: ${MODO.toUpperCase()}`);
  log(`Destino: ${DATA_DIR}`);

  paso("Estado actual");
  const invS = await inventario(join(ORIGEN_SYSTEMS, "voltac.db"));
  const invE = await inventario(join(ORIGEN_ENERGY, "voltac.db"));

  if (!invS) {
    log(`   ERROR: no se encontró ${join(ORIGEN_SYSTEMS, "voltac.db")}`);
    process.exit(1);
  }

  const contables = Object.keys(invS).filter(esContable);
  const operativas = Object.keys(invS).filter((t) => !esContable(t));

  log(`   Systems · operativas: ${operativas.map((t) => `${t}=${invS[t]}`).join(", ")}`);
  log(`   Systems · contables : ${contables.length} tablas, ${contables.reduce((a, t) => a + invS[t], 0)} filas`);
  log(invE
    ? `   Energy  · operativas: ${Object.keys(invE).filter((t) => !esContable(t)).map((t) => `${t}=${invE[t]}`).join(", ")}`
    : `   Energy  · sin base todavía (se creará vacía)`);

  if (MODO === "revisar") {
    paso("Nada se ha escrito");
    log("   Vuelva a ejecutar con --ejecutar cuando los números de arriba cuadren.");
    log("   Los archivos originales NO se tocan: este script solo copia.\n");
    return;
  }

  paso("Creando estructura");
  for (const d of [DATA_DIR, join(DATA_DIR, "systems"), join(DATA_DIR, "energy"), join(DATA_DIR, "uploads")]) {
    mkdirSync(d, { recursive: true });
  }
  log(`   ${DATA_DIR}`);

  paso("Contabilidad de la empresa → contabilidad.db");
  const filasConta = await copiarTablas(join(ORIGEN_SYSTEMS, "voltac.db"), join(DATA_DIR, "contabilidad.db"), esContable);

  paso("Base operativa de Voltac Systems");
  const filasS = await copiarTablas(join(ORIGEN_SYSTEMS, "voltac.db"), join(DATA_DIR, "systems", "voltac.db"), (t) => !esContable(t));

  if (invE) {
    paso("Base operativa de Voltac Energy");
    await copiarTablas(join(ORIGEN_ENERGY, "voltac.db"), join(DATA_DIR, "energy", "voltac.db"), (t) => !esContable(t));
  }

  paso("Archivos subidos");
  for (const [origen, marca] of [[ORIGEN_SYSTEMS, "systems"], [ORIGEN_ENERGY, "energy"]]) {
    const src = join(origen, "uploads");
    if (!existsSync(src)) { log(`   ${marca}: sin uploads`); continue; }
    cpSync(src, join(DATA_DIR, "uploads", marca), { recursive: true });
    log(`   ${marca}: copiado a uploads/${marca}/`);
  }

  paso("Verificación");
  const finalConta = await inventario(join(DATA_DIR, "contabilidad.db"));
  const finalS = await inventario(join(DATA_DIR, "systems", "voltac.db"));
  const finalE = await inventario(join(DATA_DIR, "energy", "voltac.db"));

  let ok = true;
  for (const t of contables) {
    const antes = invS[t], despues = finalConta?.[t] ?? 0;
    if (antes !== despues) { ok = false; log(`   DESCUADRE ${t}: antes ${antes}, ahora ${despues}`); }
  }
  for (const t of operativas) {
    const antes = invS[t], despues = finalS?.[t] ?? 0;
    if (antes !== despues) { ok = false; log(`   DESCUADRE ${t}: antes ${antes}, ahora ${despues}`); }
  }
  if (invE) {
    for (const t of Object.keys(invE).filter((x) => !esContable(x))) {
      const antes = invE[t], despues = finalE?.[t] ?? 0;
      if (antes !== despues) { ok = false; log(`   DESCUADRE energy.${t}: antes ${antes}, ahora ${despues}`); }
    }
  }

  if (ok) {
    log(`   Todos los conteos cuadran. Contabilidad: ${filasConta} filas. Systems: ${filasS} filas.`);
    log(`\n   Los archivos originales siguen intactos. Bórrelos solo después de`);
    log(`   comprobar los dos paneles en funcionamiento.\n`);
  } else {
    log(`\n   HAY DESCUADRES. No cambie la configuración del servidor todavía.\n`);
    process.exit(1);
  }
}

main().catch((e) => { console.error("\nFalló la migración:", e.message); process.exit(1); });
