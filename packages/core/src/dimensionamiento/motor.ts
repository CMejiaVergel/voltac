/**
 * Dimensionamiento fotovoltaico. Una ecuación, no un modelo de lenguaje.
 *
 * Todo lo que hay aquí es determinista: los mismos datos de entrada dan siempre
 * exactamente el mismo resultado. Eso es el punto. Un asistente de IA que
 * calcula de cabeza da una cifra distinta cada vez que se lo preguntan, y en
 * este negocio la cifra es lo primero que el cliente anota y lo último que
 * olvida. El asistente recoge los datos, llama a esto y explica el resultado;
 * la aritmética no la hace él.
 *
 * De la misma decisión sale un segundo beneficio: cada cálculo que se resuelve
 * aquí es un cálculo que no se paga en tokens.
 *
 * Las cifras ajustables —precios, radiación, factores— viven en `datos.ts`.
 */

import {
  AMBIENTAL,
  buscarModalidad,
  buscarRegion,
  buscarTecho,
  ECONOMIA,
  INCENTIVOS,
  PANEL,
  PRECIO_BATERIA_POR_KWH,
  precioBasePorWp,
  REPARTO_INVERSION,
} from "./datos";

export type TipoCliente = "residencial" | "comercial" | "industrial";

export interface EntradaDimensionamiento {
  /** Promedio de kWh al mes. En la factura: "consumo promedio" o el histórico. */
  consumoMensualKwh: number;
  /**
   * Lo que cuesta el kilovatio hora, en pesos.
   *
   * En la factura aparece como CU (Costo Unitario de prestación del servicio).
   * Si no se tiene a mano, dividir el valor del consumo entre los kWh
   * facturados da un número suficientemente bueno.
   */
  precioKwh: number;
  region: string;
  modalidad: string;
  tipoTecho: string;
  tipoCliente: TipoCliente;
  /**
   * Qué fracción del consumo se quiere cubrir. 1 = todo.
   *
   * Pasar de 1 rara vez conviene: los excedentes se liquidan a menos de lo que
   * cuesta comprar la energía, así que cada kWh de más rinde menos que el
   * anterior.
   */
  cubrimiento?: number;
  /** Solo para híbrido y aislado: cuántas horas debe aguantar sin sol. */
  autonomiaHoras?: number;
  /** Área de techo disponible, si se conoce. Sirve para avisar si no cabe. */
  areaDisponibleM2?: number;
  /**
   * Si los equipos se compran con la exclusión de IVA de la Ley 1715.
   *
   * Por defecto sí, y también en vivienda. La exclusión recae sobre los equipos
   * de generación con energías renovables, no sobre el tipo de cliente: un
   * hogar la aprovecha igual que una empresa siempre que el equipo esté en el
   * listado de la UPME y se haga el trámite. Es la deducción de RENTA la que
   * requiere declarar, y esa es otra cosa.
   */
  exclusionIva?: boolean;
  /** Potencia del panel, si se cotiza con uno distinto al del catálogo. */
  panelWp?: number;
}

export interface ResultadoDimensionamiento {
  sistema: {
    potenciaKwp: number;
    numeroPaneles: number;
    panelWp: number;
    areaRequeridaM2: number;
    generacionMensualKwh: number;
    generacionAnualKwh: number;
    cubrimientoReal: number;
    hsp: number;
    performanceRatio: number;
    bateriaKwh: number | null;
  };
  inversion: {
    /** Antes de IVA. Es el número que se compara con otras cotizaciones. */
    subtotal: number;
    iva: number;
    total: number;
    costoPorWp: number;
    desglose: { concepto: string; valor: number }[];
  };
  ahorro: {
    mensualPrimerAnio: number;
    anualPrimerAnio: number;
    acumulado25Anios: number;
    /** Fracción de la factura que deja de pagarse. */
    reduccionFactura: number;
  };
  retorno: {
    anios: number | null;
    meses: number | null;
    /** Sin contar que la tarifa de energía sube. El escenario pesimista. */
    aniosSinEscalada: number | null;
    /** Descontando el beneficio tributario. Solo para quien declara renta. */
    aniosConIncentivos: number | null;
    calificacion: "excelente" | "muy bueno" | "aceptable" | "largo" | "no viable";
    flujoAnual: { anio: number; ahorro: number; acumulado: number }[];
  };
  impacto: {
    co2EvitadoTonAnio: number;
    co2Evitado25AniosTon: number;
    arbolesEquivalentes: number;
    hogaresEquivalentes: number;
    /** Aporte a la meta país de energías renovables, en términos legibles. */
    notaSocial: string;
  };
  incentivos: {
    aplicaDeduccion: boolean;
    deduccionRenta: number;
    ahorroTributarioEstimado: number;
    ahorroPorExclusionIva: number;
    notas: string[];
  };
  /** Lo que hay que decirle al cliente aunque no lo pregunte. */
  advertencias: string[];
  /** Todo lo que se dio por supuesto. Nada de esto puede quedar implícito. */
  supuestos: string[];
  entrada: Required<Omit<EntradaDimensionamiento, "areaDisponibleM2">> & {
    areaDisponibleM2: number | null;
  };
}

const redondear = (n: number, decimales = 0): number => {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
};

export function dimensionar(entrada: EntradaDimensionamiento): ResultadoDimensionamiento {
  const advertencias: string[] = [];
  const supuestos: string[] = [];

  const region = buscarRegion(entrada.region);
  const modalidad = buscarModalidad(entrada.modalidad);
  const techo = buscarTecho(entrada.tipoTecho);

  const consumoMensual = Math.max(1, entrada.consumoMensualKwh);
  const precioKwh = Math.max(1, entrada.precioKwh);
  const cubrimiento = clamp(entrada.cubrimiento ?? 1, 0.1, 2);
  const panelWp = entrada.panelWp ?? PANEL.potenciaWp;
  const exclusionIva = entrada.exclusionIva ?? true;

  // --- Potencia y paneles ---------------------------------------------------
  //
  // La ecuación de siempre: la energía que hace falta al mes, dividida entre lo
  // que produce un kilovatio pico en esa región durante un mes.
  const energiaPorKwpMes = region.hsp * 30 * modalidad.pr;
  const kwpObjetivo = (consumoMensual * cubrimiento) / energiaPorKwpMes;

  // Los paneles vienen enteros. El sistema real siempre queda un poco por
  // encima del objetivo, nunca por debajo.
  const numeroPaneles = Math.max(1, Math.ceil((kwpObjetivo * 1000) / panelWp));
  const potenciaKwp = (numeroPaneles * panelWp) / 1000;

  const generacionMensual = potenciaKwp * energiaPorKwpMes;
  const generacionAnual = generacionMensual * 12;
  const consumoAnual = consumoMensual * 12;

  const areaRequerida = numeroPaneles * PANEL.areaModuloM2 * techo.factorArea;

  // --- Baterías -------------------------------------------------------------
  let bateriaKwh: number | null = null;
  if (modalidad.requiereBaterias) {
    const autonomia = entrada.autonomiaHoras ?? (modalidad.id === "aislado" ? 24 : 8);
    // Consumo medio por hora, por las horas que debe aguantar. Con 80% de
    // profundidad de descarga, que es lo que admite el litio sin castigar la
    // vida útil de la batería.
    const consumoPorHora = consumoMensual / 30 / 24;
    bateriaKwh = redondear((consumoPorHora * autonomia) / 0.8, 1);
    supuestos.push(
      `Banco de baterías dimensionado para ${autonomia} horas de autonomía, con 80% de profundidad de descarga.`,
    );
  }

  // --- Inversión ------------------------------------------------------------
  const copPorWp = precioBasePorWp(potenciaKwp) * modalidad.factorPrecio * techo.factorPrecio;
  const subtotalSistema = potenciaKwp * 1000 * copPorWp;
  const subtotalBaterias = bateriaKwh ? bateriaKwh * PRECIO_BATERIA_POR_KWH : 0;
  const subtotal = Math.round(subtotalSistema + subtotalBaterias);

  const iva = exclusionIva ? 0 : Math.round(subtotal * INCENTIVOS.iva);
  const total = subtotal + iva;

  const desglose = REPARTO_INVERSION.map((r) => ({
    concepto: r.concepto,
    valor: Math.round(subtotalSistema * r.fraccion),
  }));
  if (subtotalBaterias) desglose.push({ concepto: "Banco de baterías", valor: Math.round(subtotalBaterias) });

  // --- Ahorro y retorno -----------------------------------------------------
  const flujo = proyectar({
    generacionAnual,
    consumoAnual,
    precioKwh,
    inversion: total,
    escalada: ECONOMIA.escaladaTarifaAnual,
  });
  const flujoSinEscalada = proyectar({
    generacionAnual,
    consumoAnual,
    precioKwh,
    inversion: total,
    escalada: 0,
  });

  const ahorroAnual = flujo[0]?.ahorro ?? 0;
  const acumulado25 = flujo.at(-1)?.acumulado ?? 0;

  // --- Incentivos -----------------------------------------------------------
  //
  // La deducción de renta la aprovecha quien declara renta. Un hogar que no
  // declara no le saca nada, y decirle lo contrario es venderle humo.
  const aplicaDeduccion = entrada.tipoCliente !== "residencial";
  const ahorroTributario = aplicaDeduccion
    ? Math.round(subtotal * INCENTIVOS.deduccionRenta * INCENTIVOS.tarifaRentaEmpresa)
    : 0;
  const ahorroPorIva = exclusionIva ? Math.round(subtotal * INCENTIVOS.iva) : 0;

  const flujoConIncentivos = aplicaDeduccion
    ? proyectar({
        generacionAnual,
        consumoAnual,
        precioKwh,
        inversion: total - ahorroTributario,
        escalada: ECONOMIA.escaladaTarifaAnual,
      })
    : flujo;

  const anios = puntoDeEquilibrio(flujo);
  const calificacion = calificar(anios);

  // --- Impacto --------------------------------------------------------------
  const co2Anual = (generacionAnual * AMBIENTAL.factorEmisionKgPorKwh) / 1000;
  // A 25 años no es 25 veces el primer año: el panel se degrada.
  const generacion25 = flujo.reduce((s, f) => s + f.generacion, 0);
  const co2Total = (generacion25 * AMBIENTAL.factorEmisionKgPorKwh) / 1000;

  // --- Advertencias ---------------------------------------------------------
  if (entrada.areaDisponibleM2 && areaRequerida > entrada.areaDisponibleM2) {
    const cabe = Math.floor(entrada.areaDisponibleM2 / (PANEL.areaModuloM2 * techo.factorArea));
    advertencias.push(
      `El sistema necesita ${Math.round(areaRequerida)} m² y hay ${Math.round(entrada.areaDisponibleM2)} m² disponibles. ` +
        `En esa área caben unos ${cabe} paneles (${redondear((cabe * panelWp) / 1000, 1)} kWp), que cubrirían ` +
        `cerca del ${Math.round((cabe / numeroPaneles) * cubrimiento * 100)}% del consumo.`,
    );
  }

  if (cubrimiento > 1.05) {
    advertencias.push(
      "El sistema está dimensionado por encima del consumo. Los excedentes se liquidan a menos de lo que cuesta " +
        "comprar la energía, así que cada kilovatio de más rinde menos que el anterior.",
    );
  }

  if (calificacion === "no viable" || calificacion === "largo") {
    advertencias.push(
      `Con este consumo y esta tarifa el retorno se va a ${anios ? Math.round(anios) : "más de 25"} años. ` +
        "El proyecto es técnicamente posible pero difícil de justificar en plata. Antes de cotizar conviene " +
        "revisar si el consumo va a crecer, si hay tarifa comercial en vez de residencial, o si el motivo real " +
        "es el respaldo y no el ahorro.",
    );
  }

  if (modalidad.requiereBaterias) {
    advertencias.push(
      "Las baterías son el renglón más caro y hay que reemplazarlas alrededor del año 10. El retorno calculado " +
        "no incluye ese reemplazo.",
    );
  }

  if (potenciaKwp > 1000) {
    advertencias.push(
      "Por encima de 1 MW el proyecto deja de ser autogeneración a pequeña escala y cambia el trámite ante el " +
        "operador de red. Requiere revisión de ingeniería.",
    );
  }

  // --- Supuestos ------------------------------------------------------------
  supuestos.push(
    `Radiación de ${region.hsp} HSP al día (${region.nombre}), del Atlas de IDEAM y UPME.`,
    `Rendimiento del sistema del ${Math.round(modalidad.pr * 100)}%, típico de un sistema ${modalidad.nombre.toLowerCase()}.`,
    `Paneles de ${panelWp} Wp.`,
    `Tarifa de energía de $${Math.round(precioKwh).toLocaleString("es-CO")} por kWh, subiendo ${Math.round(
      ECONOMIA.escaladaTarifaAnual * 100,
    )}% al año.`,
    `Degradación de los paneles del ${ECONOMIA.degradacionAnual * 100}% anual y mantenimiento del ${Math.round(
      ECONOMIA.mantenimientoAnual * 100,
    )}% de la inversión al año.`,
    `Factor de emisión de la red de ${AMBIENTAL.factorEmisionKgPorKwh} kg CO₂eq/kWh (UPME ${AMBIENTAL.anioFactor}).`,
    exclusionIva
      ? "Precio sin IVA por la exclusión de la Ley 1715, que exige certificar el proyecto ante la UPME."
      : "Precio con IVA del 19%: no se contempló la certificación ante la UPME.",
  );

  const notasIncentivos: string[] = [];
  if (aplicaDeduccion) {
    notasIncentivos.push(
      `Deducción de renta del ${INCENTIVOS.deduccionRenta * 100}% de la inversión (Ley 1715 de 2014, modificada por la ` +
        `Ley 2099 de 2021), repartible hasta en ${INCENTIVOS.aniosDeduccion} años y sin superar el ` +
        `${INCENTIVOS.topeRentaLiquida * 100}% de la renta líquida de cada año.`,
      `Depreciación acelerada de hasta el ${Math.round(INCENTIVOS.depreciacionAcelerada * 100)}% anual.`,
    );
  } else {
    notasIncentivos.push(
      "La deducción de renta la aprovecha quien declara renta, así que en un hogar normalmente no aplica. " +
        "La exclusión de IVA sobre los equipos sí.",
    );
  }
  notasIncentivos.push(
    "Exclusión de IVA y exención de arancel sobre los equipos, previa certificación del proyecto ante la UPME.",
    `Los beneficios de la Ley 1715 están vigentes hasta ${INCENTIVOS.vigenteHasta}.`,
    "Esto es información comercial, no asesoría tributaria. Cada caso lo debe revisar el contador del cliente.",
  );

  return {
    sistema: {
      potenciaKwp: redondear(potenciaKwp, 2),
      numeroPaneles,
      panelWp,
      areaRequeridaM2: redondear(areaRequerida, 0),
      generacionMensualKwh: redondear(generacionMensual, 0),
      generacionAnualKwh: redondear(generacionAnual, 0),
      cubrimientoReal: redondear(generacionMensual / consumoMensual, 3),
      hsp: region.hsp,
      performanceRatio: modalidad.pr,
      bateriaKwh,
    },
    inversion: {
      subtotal,
      iva,
      total,
      costoPorWp: Math.round(copPorWp),
      desglose,
    },
    ahorro: {
      mensualPrimerAnio: Math.round(ahorroAnual / 12),
      anualPrimerAnio: Math.round(ahorroAnual),
      acumulado25Anios: Math.round(acumulado25 + total),
      reduccionFactura: redondear(Math.min(1, generacionMensual / consumoMensual), 3),
    },
    retorno: {
      anios: anios === null ? null : redondear(anios, 1),
      meses: anios === null ? null : Math.round(anios * 12),
      aniosSinEscalada: redondearONulo(puntoDeEquilibrio(flujoSinEscalada)),
      aniosConIncentivos: redondearONulo(puntoDeEquilibrio(flujoConIncentivos)),
      calificacion,
      flujoAnual: flujo.map((f) => ({
        anio: f.anio,
        ahorro: Math.round(f.ahorro),
        acumulado: Math.round(f.acumulado),
      })),
    },
    impacto: {
      co2EvitadoTonAnio: redondear(co2Anual, 2),
      co2Evitado25AniosTon: redondear(co2Total, 1),
      arbolesEquivalentes: Math.round((co2Anual * 1000) / AMBIENTAL.co2PorArbolAnio),
      hogaresEquivalentes: redondear(
        generacionAnual / 12 / AMBIENTAL.consumoHogarMensualKwh,
        1,
      ),
      notaSocial:
        `Equivale a la energía que consumen ${Math.round(
          generacionAnual / 12 / AMBIENTAL.consumoHogarMensualKwh,
        )} hogares colombianos, generada sin quemar nada. Cada kilovatio instalado en techos ` +
        "libera capacidad de la red para otros usuarios y reduce la dependencia del país de la generación térmica " +
        "en los años de El Niño, que es cuando la energía se encarece para todo el mundo.",
    },
    incentivos: {
      aplicaDeduccion,
      deduccionRenta: aplicaDeduccion ? Math.round(subtotal * INCENTIVOS.deduccionRenta) : 0,
      ahorroTributarioEstimado: ahorroTributario,
      ahorroPorExclusionIva: ahorroPorIva,
      notas: notasIncentivos,
    },
    advertencias,
    supuestos,
    entrada: {
      consumoMensualKwh: consumoMensual,
      precioKwh,
      region: region.id,
      modalidad: modalidad.id,
      tipoTecho: techo.id,
      tipoCliente: entrada.tipoCliente,
      cubrimiento,
      autonomiaHoras: entrada.autonomiaHoras ?? 0,
      exclusionIva,
      panelWp,
      areaDisponibleM2: entrada.areaDisponibleM2 ?? null,
    },
  };
}

interface Anio {
  anio: number;
  generacion: number;
  ahorro: number;
  acumulado: number;
}

/**
 * Flujo año a año durante la vida útil.
 *
 * No basta con dividir la inversión entre el ahorro del primer año. El panel
 * produce menos cada año, la tarifa sube y el mantenimiento cuesta: los tres se
 * mueven en direcciones distintas y el resultado no es una línea recta.
 */
function proyectar(p: {
  generacionAnual: number;
  consumoAnual: number;
  precioKwh: number;
  inversion: number;
  escalada: number;
}): Anio[] {
  const mantenimiento = p.inversion * ECONOMIA.mantenimientoAnual;
  const filas: Anio[] = [];
  let acumulado = -p.inversion;

  for (let n = 1; n <= ECONOMIA.vidaUtilAnios; n++) {
    const generacion = p.generacionAnual * (1 - ECONOMIA.degradacionAnual) ** (n - 1);
    const tarifa = p.precioKwh * (1 + p.escalada) ** (n - 1);

    // Lo que se consume en el sitio vale la tarifa completa; lo que sobra se
    // entrega a la red y se liquida a menos.
    const autoconsumo = Math.min(generacion, p.consumoAnual);
    const excedente = Math.max(0, generacion - p.consumoAnual);
    const ahorro = autoconsumo * tarifa + excedente * tarifa * ECONOMIA.factorExcedentes - mantenimiento;

    acumulado += ahorro;
    filas.push({ anio: n, generacion, ahorro, acumulado });
  }

  return filas;
}

/** En qué año el acumulado cruza el cero, interpolando dentro del año. */
function puntoDeEquilibrio(flujo: Anio[]): number | null {
  for (let i = 0; i < flujo.length; i++) {
    const f = flujo[i]!;
    if (f.acumulado < 0) continue;
    const anterior = i === 0 ? 0 : flujo[i - 1]!.acumulado;
    const fraccion = f.ahorro > 0 ? -anterior / f.ahorro : 0;
    return f.anio - 1 + clamp(fraccion, 0, 1);
  }
  return null;
}

function calificar(anios: number | null): ResultadoDimensionamiento["retorno"]["calificacion"] {
  if (anios === null) return "no viable";
  if (anios < 4) return "excelente";
  if (anios < 6) return "muy bueno";
  if (anios < 8) return "aceptable";
  if (anios < 12) return "largo";
  return "no viable";
}

function redondearONulo(n: number | null): number | null {
  return n === null ? null : redondear(n, 1);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
