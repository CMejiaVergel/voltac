/**
 * Contraste del motor contra calculadoras públicas y contra casos reales.
 *
 * No es una prueba unitaria de que la aritmética esté bien escrita —eso se ve
 * leyéndola—. Es la comprobación de que las CIFRAS que salen son creíbles en el
 * mercado colombiano, que es un problema distinto y bastante más difícil de
 * detectar: un motor puede estar impecable y aun así entregar un precio que
 * ningún proveedor del país cobraría.
 *
 * Cuando se cambien los precios de `datos.ts` por los de Voltac, este archivo
 * es lo primero que hay que volver a correr. Las tolerancias están puestas
 * flojas a propósito: se busca detectar un error de orden de magnitud, no
 * cuadrar contra el céntimo con la competencia.
 *
 *   npx tsx packages/core/src/dimensionamiento/validar.ts
 */

import { calificarProspecto } from "./calificacion";
import { dimensionar } from "./motor";

const cop = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
let fallos = 0;

function comprobar(etiqueta: string, obtenido: number, esperado: number, toleranciaPct: number) {
  const desvio = Math.abs(obtenido - esperado) / esperado;
  const ok = desvio <= toleranciaPct / 100;
  if (!ok) fallos++;
  const signo = ok ? "  ok  " : " FALLA";
  console.log(
    `${signo}  ${etiqueta.padEnd(34)} obtenido ${String(Math.round(obtenido)).padStart(12)}` +
      `   esperado ~${String(Math.round(esperado)).padStart(12)}   desvío ${(desvio * 100).toFixed(1)}%`,
  );
}

// ---------------------------------------------------------------------------
console.log("\n=== Caso 1: calculadora de Ambiente Solar ================================");
console.log("2.835 kWh/mes, Bogotá / resto del país, teja de barro, on-grid.");
console.log("Su resultado: 26,17 kWp · 43 paneles · 129 m² · $97.820.585\n");

const c1 = dimensionar({
  consumoMensualKwh: 2835,
  precioKwh: 950,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "teja-barro",
  tipoCliente: "comercial",
});

comprobar("potencia (kWp)", c1.sistema.potenciaKwp, 26.17, 5);
comprobar("número de paneles", c1.sistema.numeroPaneles, 43, 5);
comprobar("área requerida (m²)", c1.sistema.areaRequeridaM2, 129, 15);
comprobar("inversión (COP)", c1.inversion.subtotal, 97_820_585, 12);
comprobar("generación mensual (kWh)", c1.sistema.generacionMensualKwh, 2835, 5);

// ---------------------------------------------------------------------------
console.log("\n=== Caso 2: casa promedio ================================================");
console.log("Referencia del mercado: 5 kWp instalados y legalizados, $18–25 millones.\n");

const c2 = dimensionar({
  consumoMensualKwh: 550,
  precioKwh: 900,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "teja-metalica",
  tipoCliente: "residencial",
});

comprobar("potencia (kWp)", c2.sistema.potenciaKwp, 5, 20);
comprobar("inversión con IVA (COP)", c2.inversion.total, 21_500_000, 25);

// ---------------------------------------------------------------------------
console.log("\n=== Caso 3: empresa pequeña ==============================================");
console.log("Referencia del mercado: 15 kWp desde $60 millones.\n");

const c3 = dimensionar({
  consumoMensualKwh: 1650,
  precioKwh: 780,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "losa-plana",
  tipoCliente: "comercial",
});

comprobar("potencia (kWp)", c3.sistema.potenciaKwp, 15, 20);
comprobar("inversión (COP)", c3.inversion.subtotal, 60_000_000, 25);

// ---------------------------------------------------------------------------
// El retorno es la cifra que decide si el prospecto sigue o se va, así que
// importa que caiga en el rango que el sector maneja: entre 3 y 7 años para un
// on-grid con tarifa comercial. Un motor que devuelva 1 año o 20 está mal
// calibrado aunque cada operación por separado sea correcta.
console.log("\n=== Caso 4: el retorno cae donde debe ====================================\n");

for (const [nombre, r] of [
  ["casa 550 kWh", c2],
  ["empresa 1.650 kWh", c3],
  ["planta 2.835 kWh", c1],
] as const) {
  const a = r.retorno.anios;
  const ok = a !== null && a >= 2.5 && a <= 9;
  if (!ok) fallos++;
  console.log(
    `${ok ? "  ok  " : " FALLA"}  ${nombre.padEnd(20)} ${a ?? "nunca"} años ` +
      `(sin escalada ${r.retorno.aniosSinEscalada ?? "nunca"}, con incentivos ${r.retorno.aniosConIncentivos ?? "n/a"})` +
      `   → ${r.retorno.calificacion}`,
  );
}

// ---------------------------------------------------------------------------
// Lo que el usuario pidió que el motor respetara: a mayor consumo, mejor
// retorno. Si esta relación se rompe, la puntuación del prospecto que se
// construye encima queda al revés.
console.log("\n=== Caso 5: a más consumo, retorno más corto =============================\n");

let anterior = Number.POSITIVE_INFINITY;
let monotono = true;
for (const consumo of [200, 400, 800, 1600, 3200, 8000, 20000]) {
  const r = dimensionar({
    consumoMensualKwh: consumo,
    precioKwh: 850,
    region: "andina",
    modalidad: "on-grid",
    tipoTecho: "teja-metalica",
    tipoCliente: consumo >= 1000 ? "comercial" : "residencial",
  });
  const a = r.retorno.anios;
  if (a !== null && a > anterior + 0.05) monotono = false;
  if (a !== null) anterior = a;
  console.log(
    `        ${String(consumo).padStart(6)} kWh/mes  →  ${String(r.sistema.potenciaKwp).padStart(7)} kWp   ` +
      `${cop(r.inversion.total).padStart(16)}   retorno ${String(a ?? "nunca").padStart(5)} años   ${r.retorno.calificacion}`,
  );
}
if (!monotono) {
  fallos++;
  console.log("\n FALLA  el retorno no mejora de forma monótona al subir el consumo");
} else {
  console.log("\n  ok    el retorno mejora al subir el consumo, como debe ser");
}

// ---------------------------------------------------------------------------
console.log("\n=== Caso 6: la puntuación decide a quién se le ofrece reunión ============");
console.log("Lo que separa a un prospecto de un curioso no es el retorno del proyecto");
console.log("sino si la persona está en posición de hacerlo.\n");

const perfiles = [
  {
    nombre: "hogar estrato bajo",
    entrada: { consumoMensualKwh: 120, precioKwh: 520, tipoCliente: "residencial" as const },
    senales: {},
    esperado: false,
  },
  {
    nombre: "hogar clase media, curioseando",
    entrada: { consumoMensualKwh: 450, precioKwh: 900, tipoCliente: "residencial" as const },
    senales: { cuandoLoHaria: "explorando" as const },
    esperado: false,
  },
  {
    nombre: "hogar grande, con fecha",
    entrada: { consumoMensualKwh: 900, precioKwh: 950, tipoCliente: "residencial" as const },
    senales: { cuandoLoHaria: "este-ano" as const, preguntoFinanciacion: true, esPropietario: true },
    esperado: true,
  },
  {
    nombre: "comercio mediano",
    entrada: { consumoMensualKwh: 2500, precioKwh: 800, tipoCliente: "comercial" as const },
    senales: { vieneDeFormulario: true },
    esperado: true,
  },
  {
    nombre: "planta industrial",
    entrada: { consumoMensualKwh: 12000, precioKwh: 750, tipoCliente: "industrial" as const },
    senales: { pidioCotizacion: true, cuandoLoHaria: "ya" as const },
    esperado: true,
  },
  {
    nombre: "empresa grande pero arrendataria",
    entrada: { consumoMensualKwh: 6000, precioKwh: 780, tipoCliente: "comercial" as const },
    senales: { esPropietario: false, cuandoLoHaria: "este-ano" as const },
    esperado: false,
  },
];

for (const p of perfiles) {
  const r = dimensionar({
    region: "andina",
    modalidad: "on-grid",
    tipoTecho: "teja-metalica",
    ...p.entrada,
  });
  const q = calificarProspecto({ resultado: r, ...p.senales });
  const ok = q.ofrecerReunion === p.esperado;
  if (!ok) fallos++;
  console.log(
    `${ok ? "  ok  " : " FALLA"}  ${p.nombre.padEnd(32)} ${String(q.puntaje).padStart(3)} pts  ` +
      `${q.nivel.padEnd(14)} reunión: ${q.ofrecerReunion ? "sí" : "no "}   ` +
      `(proyecto: retorno ${r.retorno.anios} años, ${r.retorno.calificacion})`,
  );
}

const c6 = dimensionar({
  consumoMensualKwh: 120,
  precioKwh: 520,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "teja-fibrocemento",
  tipoCliente: "residencial",
});
const q6 = calificarProspecto({ resultado: c6 });
console.log(`\n        El hogar de estrato bajo, en detalle:`);
console.log(
  `        Proyecto sano —${c6.sistema.potenciaKwp} kWp, ${cop(c6.inversion.total)}, retorno ${c6.retorno.anios} años—`,
);
console.log(
  `        pero ahorra ${cop(c6.ahorro.mensualPrimerAnio)} al mes. ${q6.puntaje} puntos: ${q6.nivel}.`,
);
console.log(`        → ${q6.recomendacion}`);

// ---------------------------------------------------------------------------
console.log("\n=== Caso 7: las tres modalidades =========================================\n");

for (const modalidad of ["on-grid", "hibrido", "aislado"]) {
  const r = dimensionar({
    consumoMensualKwh: 900,
    precioKwh: 900,
    region: "caribe",
    modalidad,
    tipoTecho: "teja-metalica",
    tipoCliente: "comercial",
  });
  console.log(
    `        ${modalidad.padEnd(9)}  ${String(r.sistema.potenciaKwp).padStart(6)} kWp   ` +
      `batería ${String(r.sistema.bateriaKwh ?? "—").padStart(5)} kWh   ` +
      `${cop(r.inversion.total).padStart(16)}   retorno ${r.retorno.anios ?? "nunca"} años`,
  );
}

// ---------------------------------------------------------------------------
console.log("\n=== Caso 8: la región cambia el resultado ================================");
console.log("Mismo consumo, distinto sol. Es el error más caro de un dimensionamiento.\n");

for (const region of ["guajira", "caribe", "andina", "pacifico"]) {
  const r = dimensionar({
    consumoMensualKwh: 1000,
    precioKwh: 900,
    region,
    modalidad: "on-grid",
    tipoTecho: "teja-metalica",
    tipoCliente: "comercial",
  });
  console.log(
    `        ${region.padEnd(10)} ${String(r.sistema.hsp).padStart(4)} HSP  →  ` +
      `${String(r.sistema.potenciaKwp).padStart(6)} kWp   ${String(r.sistema.numeroPaneles).padStart(3)} paneles   ` +
      `${cop(r.inversion.total).padStart(16)}`,
  );
}

// ---------------------------------------------------------------------------
console.log("\n=== Caso 9: aviso cuando el techo no alcanza =============================\n");

const c9 = dimensionar({
  consumoMensualKwh: 2000,
  precioKwh: 900,
  region: "andina",
  modalidad: "on-grid",
  tipoTecho: "losa-plana",
  tipoCliente: "comercial",
  areaDisponibleM2: 60,
});
if (!c9.advertencias.length) {
  fallos++;
  console.log(" FALLA  no avisó de que no cabe");
} else {
  console.log(`  ok    ${c9.advertencias[0]}`);
}

// ---------------------------------------------------------------------------
console.log("\n=== Ficha completa de un caso ============================================\n");
const f = c3;
console.log(`  Sistema      ${f.sistema.potenciaKwp} kWp · ${f.sistema.numeroPaneles} paneles de ${f.sistema.panelWp} Wp · ${f.sistema.areaRequeridaM2} m²`);
console.log(`  Generación   ${f.sistema.generacionMensualKwh.toLocaleString("es-CO")} kWh/mes (cubre el ${Math.round(f.ahorro.reduccionFactura * 100)}% de la factura)`);
console.log(`  Inversión    ${cop(f.inversion.total)} (${cop(f.inversion.costoPorWp)}/Wp)`);
console.log(`  Ahorro       ${cop(f.ahorro.mensualPrimerAnio)}/mes · ${cop(f.ahorro.acumulado25Anios)} en 25 años`);
console.log(`  Retorno      ${f.retorno.anios} años → ${f.retorno.calificacion}`);
console.log(`  Incentivos   deducción de ${cop(f.incentivos.deduccionRenta)} · ahorro tributario ~${cop(f.incentivos.ahorroTributarioEstimado)}`);
console.log(`  Ambiente     ${f.impacto.co2EvitadoTonAnio} t CO₂/año · ${f.impacto.arbolesEquivalentes} árboles · ${f.impacto.co2Evitado25AniosTon} t en 25 años`);
console.log("\n  Supuestos:");
for (const s of f.supuestos) console.log(`   · ${s}`);

console.log(
  fallos === 0
    ? "\n\nTodo cuadra.\n"
    : `\n\n${fallos} comprobacion(es) fuera de rango. Revisar datos.ts.\n`,
);
process.exit(fallos === 0 ? 0 : 1);
