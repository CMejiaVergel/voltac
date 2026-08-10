#!/usr/bin/env node
/**
 * Crea una clave de API para la tabla `api_keys` de una línea de negocio.
 *
 * Existe porque no hay ninguna clave por defecto y es deliberado: antes se
 * sembraba una fija escrita en el repositorio, así que cualquiera con acceso al
 * código podía leer y escribir prospectos. Las claves se crean a mano, una por
 * cliente, y la única copia que se ve es la que imprime este guion.
 *
 * El primer uso es el asistente de WhatsApp: la necesita para contarle al CRM
 * qué pasó en cada conversación.
 *
 * Uso:
 *   node scripts/crear-clave-api.mjs systems "Asistente WhatsApp"
 *   node scripts/crear-clave-api.mjs energy  "Asistente WhatsApp"
 *
 * Respeta VOLTAC_DATA_DIR igual que la aplicación. Si en el servidor las bases
 * viven fuera del repositorio, hay que pasarlo:
 *   VOLTAC_DATA_DIR=/var/lib/voltac node scripts/crear-clave-api.mjs systems "..."
 */

import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const VERTICALES = ["systems", "energy"];

const vertical = process.argv[2];
const nombre = process.argv[3];

if (!VERTICALES.includes(vertical) || !nombre) {
  console.error("Uso: node scripts/crear-clave-api.mjs <systems|energy> \"<nombre>\"");
  console.error("El nombre es para saber quién la usa cuando haya que revocarla.");
  process.exit(1);
}

const dataDir = resolve(process.env.VOLTAC_DATA_DIR ?? process.cwd());
const archivo = join(dataDir, vertical, "voltac.db");

if (!existsSync(archivo)) {
  console.error(`No existe la base ${archivo}.`);
  console.error("¿Falta VOLTAC_DATA_DIR, o la aplicación todavía no ha arrancado nunca?");
  process.exit(1);
}

const db = await open({ filename: archivo, driver: sqlite3.Database });

// 32 bytes de aleatoriedad. El prefijo es solo para reconocerla de un vistazo
// en un archivo de configuración y no confundirla con otro secreto.
const clave = `voltac_sk_${randomBytes(32).toString("hex")}`;

await db.run("INSERT INTO api_keys (key, name) VALUES (?, ?)", [clave, nombre]);
await db.close();

console.log(`\nClave creada para "${nombre}" en la base de ${vertical}.\n`);
console.log(`  ${clave}\n`);
console.log("Cópiala ahora: no se vuelve a mostrar y no hay forma de recuperarla.");
console.log("Va en el .env del asistente, como CRM_API_KEY.\n");
