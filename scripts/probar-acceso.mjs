#!/usr/bin/env node
/**
 * Matriz de acceso por rol, contra un servidor en marcha.
 *
 * Existe porque el control de acceso del panel es la pieza que peor falla en
 * silencio: un cambio de versión de Next o una regla mal puesta no rompen la
 * compilación, simplemente dejan una puerta abierta. Esto pide cada ruta con
 * una sesión firmada de cada rol y enseña lo que responde el servidor.
 *
 * Firma las cookies con el mismo secreto que la aplicación, así que se ejecuta
 * desde la raíz del proyecto y necesita el `.env.local` correspondiente.
 *
 * Uso:
 *   node scripts/probar-acceso.mjs http://localhost:3000 apps/systems/.env.local
 *   node scripts/probar-acceso.mjs http://localhost:3001 apps/energy/.env.local
 *
 * Las cuentas de prueba se crean y se borran solas.
 */

import { createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ENV = process.argv[3] ?? "apps/systems/.env.local";

const entorno = Object.fromEntries(
  readFileSync(ENV, "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const secreto = entorno.ADMIN_SESSION_SECRET;
if (!secreto) {
  console.error(`No hay ADMIN_SESSION_SECRET en ${ENV}`);
  process.exit(1);
}

const dataDir = entorno.VOLTAC_DATA_DIR ?? dirname(ENV);
const dbPath = join(dataDir, "sistema.db");

const firmar = (sub, rol) => {
  const n = Math.floor(Date.now() / 1000);
  const b = Buffer.from(JSON.stringify({ sub, rol, iat: n, exp: n + 600 })).toString("base64url");
  return `${b}.${createHmac("sha256", secreto).update(b).digest("base64url")}`;
};

const hashear = (p) => {
  const s = randomBytes(16);
  return `pbkdf2$210000$${s.toString("base64url")}$${pbkdf2Sync(p, s, 210000, 32, "sha256").toString("base64url")}`;
};

const RUTAS = [
  "/",
  "/admin/login",
  "/admin",
  "/admin/leads",
  "/admin/ia-assistant",
  "/admin/usuarios",
  "/admin/configuracion",
  "/admin/proyectos",
  "/admin/news",
  "/admin/analytics",
  "/admin/preview",
  "/admin/accounting",
  "/admin/accounting/facturacion",
  "/admin/accounting/configuracion",
  "/api/accounting/dashboard",
  "/api/usuarios",
];

const CUENTAS = [
  ["prueba-propietario", "propietario"],
  ["prueba-contador", "contador"],
  ["prueba-moderador", "moderador"],
];

const db = await open({ filename: dbPath, driver: sqlite3.Database });

// Las cuentas tienen que existir de verdad: el proxy contrasta el token contra
// el estado vigente, así que una sesión firmada de un usuario inexistente no
// pasa —que es justamente lo que se quiere—.
for (const [usuario, rol] of CUENTAS) {
  await db.run("DELETE FROM usuarios WHERE usuario = ?", [usuario]);
  await db.run("INSERT INTO usuarios (usuario, nombre, password_hash, rol) VALUES (?,?,?,?)", [
    usuario,
    "Cuenta de prueba",
    hashear(randomBytes(24).toString("hex")),
    rol,
  ]);
}

try {
  const sujetos = [["sin sesion", null], ...CUENTAS.map(([u, r]) => [r, firmar(u, r)])];
  const filas = [];

  for (const ruta of RUTAS) {
    const fila = { ruta };
    for (const [nombre, token] of sujetos) {
      const res = await fetch(BASE + ruta, {
        redirect: "manual",
        headers: token ? { cookie: `voltac_session=${token}` } : {},
      });
      const destino = res.headers.get("location");
      fila[nombre] = destino
        ? `${res.status}→${new URL(destino, BASE).pathname}`
        : String(res.status);
    }
    filas.push(fila);
  }

  console.log(`\nMatriz de acceso  ${BASE}\n`);
  console.table(filas);

  // Revocación: la misma cookie deja de servir en cuanto la cuenta se apaga.
  const token = firmar("prueba-contador", "contador");
  const pedir = async () =>
    (await fetch(`${BASE}/admin/accounting`, { headers: { cookie: `voltac_session=${token}` } }))
      .status;

  const antes = await pedir();
  await db.run("UPDATE usuarios SET activo = 0 WHERE usuario = 'prueba-contador'");
  const despues = await pedir();
  await db.run("UPDATE usuarios SET rol = 'moderador' WHERE usuario = 'prueba-contador'");
  await db.run("UPDATE usuarios SET activo = 1 WHERE usuario = 'prueba-contador'");
  const otroRol = await pedir();

  console.log("Revocacion inmediata sobre /admin/accounting, con la MISMA cookie:");
  console.table([
    { situacion: "cuenta activa, rol correcto", esperado: 200, obtenido: antes },
    { situacion: "cuenta desactivada", esperado: 404, obtenido: despues },
    { situacion: "rol cambiado en la base", esperado: 404, obtenido: otroRol },
  ]);

  const ok = antes === 200 && despues === 404 && otroRol === 404;
  console.log(ok ? "\nRevocacion: correcta\n" : "\nREVOCACION: FALLA\n");
  process.exitCode = ok ? 0 : 1;
} finally {
  for (const [usuario] of CUENTAS) await db.run("DELETE FROM usuarios WHERE usuario = ?", [usuario]);
  await db.close();
}
