/**
 * Los números con los que se calcula. Todo lo ajustable vive aquí.
 *
 * Está separado del motor a propósito. El motor es una ecuación y no cambia;
 * estas tablas cambian cada vez que se mueve el precio del panel, sale una
 * resolución nueva o la UPME publica el factor de emisión del año. Teniéndolas
 * juntas, actualizar el sistema es editar un archivo de datos y no ir a buscar
 * constantes escondidas dentro de una fórmula.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ AVISO IMPORTANTE SOBRE LOS PRECIOS                                      │
 * │                                                                          │
 * │ Los precios de PRECIOS_POR_WP son valores públicos de referencia del     │
 * │ mercado colombiano, recogidos de proveedores y comparadores. NO son los  │
 * │ precios de Voltac. Sirven para que la calculadora dé un orden de         │
 * │ magnitud creíble desde el primer día, pero hay que reemplazarlos por los │
 * │ reales antes de que ninguna cifra salga de aquí hacia un cliente en      │
 * │ firme. Mientras sean estos, todo lo que produzca el módulo es un         │
 * │ estimado y así se le dice a quien lo reciba.                             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------
// Radiación solar
// ---------------------------------------------------------------------------

/**
 * Horas Sol Pico: las horas equivalentes al día en que el sol pegara a
 * 1.000 W/m². Es el número que convierte "cuántos kilovatios instalo" en
 * "cuánta energía produzco", y en Colombia varía casi al doble entre La Guajira
 * y el Pacífico. Errar la región es el error que más desvía un dimensionamiento.
 *
 * Valores conservadores del Atlas de Radiación Solar de IDEAM y UPME: se toma
 * la parte baja de cada rango. Quedarse corto hace que el sistema produzca algo
 * más de lo prometido; pasarse hace que el cliente reclame.
 */
export interface Region {
  id: string;
  nombre: string;
  /** Departamentos que cubre, para que el asesor sepa dónde cae un municipio. */
  cubre: string;
  hsp: number;
}

export const REGIONES: readonly Region[] = [
  { id: "guajira", nombre: "La Guajira y alta Costa", cubre: "La Guajira, norte del Cesar y del Magdalena", hsp: 5.8 },
  { id: "caribe", nombre: "Costa Caribe", cubre: "Atlántico, Bolívar, Magdalena, Cesar, Córdoba, Sucre", hsp: 5.2 },
  { id: "orinoquia", nombre: "Orinoquía", cubre: "Meta, Casanare, Arauca, Vichada", hsp: 5.0 },
  { id: "tolima-huila", nombre: "Tolima y Huila", cubre: "Tolima, Huila, norte del Cauca", hsp: 4.9 },
  { id: "santanderes", nombre: "Santanderes", cubre: "Santander y Norte de Santander", hsp: 4.7 },
  { id: "valle", nombre: "Valle del Cauca", cubre: "Valle del Cauca y Cauca", hsp: 4.5 },
  { id: "antioquia", nombre: "Antioquia y Eje Cafetero", cubre: "Antioquia, Caldas, Risaralda, Quindío", hsp: 4.4 },
  { id: "andina", nombre: "Bogotá y región andina", cubre: "Cundinamarca, Bogotá, Boyacá", hsp: 4.3 },
  { id: "amazonia", nombre: "Amazonía", cubre: "Caquetá, Putumayo, Amazonas, Guaviare, Guainía, Vaupés", hsp: 4.2 },
  { id: "pacifico", nombre: "Pacífico", cubre: "Chocó y costa de Nariño", hsp: 3.8 },
];

export type RegionId = (typeof REGIONES)[number]["id"];

/** Cuando no se sabe dónde queda. Es la región más poblada y la de en medio. */
export const REGION_POR_DEFECTO = "andina";

export function buscarRegion(id: string): Region {
  return REGIONES.find((r) => r.id === id) ?? REGIONES.find((r) => r.id === REGION_POR_DEFECTO)!;
}

// ---------------------------------------------------------------------------
// Modalidades
// ---------------------------------------------------------------------------

/**
 * El *performance ratio*: qué fracción de la energía teórica llega de verdad al
 * contador, después del calor, el polvo, el cableado y el inversor.
 *
 * On-grid es el más alto porque la energía va directo del inversor a la carga.
 * Aislado pierde otro tanto en el banco de baterías —cargar y descargar cuesta—
 * y en el regulador. Híbrido está en medio: solo pasa por batería lo que no se
 * consume en el momento.
 */
export interface Modalidad {
  id: string;
  nombre: string;
  descripcion: string;
  pr: number;
  /** Multiplicador sobre el precio base por Wp. Las baterías son el grueso. */
  factorPrecio: number;
  /** Si necesita banco de baterías dimensionado por horas de autonomía. */
  requiereBaterias: boolean;
}

export const MODALIDADES: readonly Modalidad[] = [
  {
    id: "on-grid",
    nombre: "Conectado a la red",
    descripcion:
      "El sistema trabaja junto con la red del operador. Lo que produce se consume al instante y lo que sobra se entrega a la red como créditos de energía. No hay baterías, y por eso es el de menor inversión y menor retorno en tiempo. Si se va la luz, el sistema también se apaga: la normativa lo exige para no electrocutar a quien esté reparando la red.",
    pr: 0.84,
    factorPrecio: 1,
    requiereBaterias: false,
  },
  {
    id: "hibrido",
    nombre: "Híbrido",
    descripcion:
      "Conectado a la red pero con respaldo en baterías. Cuando se va la luz, las cargas esenciales siguen andando. Cuesta bastante más que el on-grid y el retorno se alarga, pero para quien no puede quedarse sin energía —una clínica, un centro de datos, una cava de frío— el respaldo es el motivo, no el ahorro.",
    pr: 0.78,
    factorPrecio: 1.5,
    requiereBaterias: true,
  },
  {
    id: "aislado",
    nombre: "Aislado de la red",
    descripcion:
      "Sin conexión al operador. Toda la energía sale del sol y de las baterías. Es la opción para fincas, antenas y sitios donde llevar la red cuesta más que el propio sistema. Ahí no se compara contra la factura sino contra lo que costaría la conexión o el diésel del planta.",
    pr: 0.7,
    factorPrecio: 1.85,
    requiereBaterias: true,
  },
];

export type ModalidadId = (typeof MODALIDADES)[number]["id"];

export function buscarModalidad(id: string): Modalidad {
  return MODALIDADES.find((m) => m.id === id) ?? MODALIDADES[0]!;
}

// ---------------------------------------------------------------------------
// Panel y espacio
// ---------------------------------------------------------------------------

/** Panel de referencia del catálogo. Un monocristalino comercial de hoy. */
export const PANEL = {
  potenciaWp: 610,
  /** Superficie del módulo. Un 610 Wp mide alrededor de 2,38 × 1,13 m. */
  areaModuloM2: 2.7,
};

/**
 * Cuánto techo hace falta de verdad, por cada m² de panel.
 *
 * En una cubierta inclinada los módulos van pegados a la teja y apenas sobra
 * nada. En una losa plana hay que inclinarlos con estructura y dejar pasillo
 * entre filas para que no se den sombra unas a otras: ahí el área real casi se
 * duplica. Es la diferencia entre un techo que alcanza y uno que no.
 */
export interface TipoTecho {
  id: string;
  nombre: string;
  /** Área ocupada por m² de módulo, contando separación entre filas. */
  factorArea: number;
  /** Sobrecosto de la estructura de montaje sobre el precio base. */
  factorPrecio: number;
  nota?: string;
}

export const TIPOS_TECHO: readonly TipoTecho[] = [
  { id: "teja-metalica", nombre: "Teja metálica / sándwich", factorArea: 1.1, factorPrecio: 1.0 },
  { id: "teja-barro", nombre: "Teja de barro", factorArea: 1.15, factorPrecio: 1.04, nota: "La fijación es más laboriosa y a veces hay que reemplazar tejas." },
  { id: "teja-fibrocemento", nombre: "Fibrocemento (eternit)", factorArea: 1.15, factorPrecio: 1.02 },
  { id: "losa-plana", nombre: "Losa plana / concreto", factorArea: 1.9, factorPrecio: 1.08, nota: "Necesita estructura inclinada y pasillo entre filas: ocupa casi el doble de área." },
  { id: "suelo", nombre: "En suelo", factorArea: 2.2, factorPrecio: 1.12, nota: "Incluye obra civil de anclaje." },
  { id: "cubierta-verde", nombre: "Cubierta transitable o parqueadero", factorArea: 2.0, factorPrecio: 1.35, nota: "Estructura elevada tipo pérgola: más acero y más obra." },
];

export function buscarTecho(id: string): TipoTecho {
  return TIPOS_TECHO.find((t) => t.id === id) ?? TIPOS_TECHO[0]!;
}

// ---------------------------------------------------------------------------
// Precios
// ---------------------------------------------------------------------------

/**
 * Precio de referencia por vatio instalado, en pesos y antes de IVA.
 *
 * Baja con el tamaño porque los costos fijos —diseño, trámite ante el operador,
 * transporte, movilización de la cuadrilla— pesan lo mismo en un sistema de
 * 3 kWp que en uno de 100. Por eso un sistema grande siempre sale más barato
 * por vatio, y por eso a un cliente con consumo alto le conviene más.
 *
 * REEMPLAZAR con los precios reales de Voltac. Ver el aviso de la cabecera.
 */
export const PRECIOS_POR_WP: readonly { hastaKwp: number; copPorWp: number }[] = [
  { hastaKwp: 3, copPorWp: 4_900 },
  { hastaKwp: 5, copPorWp: 4_400 },
  { hastaKwp: 10, copPorWp: 3_900 },
  { hastaKwp: 20, copPorWp: 3_650 },
  { hastaKwp: 50, copPorWp: 3_450 },
  { hastaKwp: 100, copPorWp: 3_250 },
  { hastaKwp: Number.POSITIVE_INFINITY, copPorWp: 3_050 },
];

export function precioBasePorWp(kwp: number): number {
  return PRECIOS_POR_WP.find((e) => kwp <= e.hastaKwp)!.copPorWp;
}

/** Batería de litio, por kWh de capacidad útil. Es el renglón más caro. */
export const PRECIO_BATERIA_POR_KWH = 1_950_000;

/**
 * Cómo se reparte la inversión. Solo para explicarle al cliente en qué se va su
 * dinero; la suma sale del precio por vatio, no de sumar estos renglones.
 */
export const REPARTO_INVERSION: readonly { concepto: string; fraccion: number }[] = [
  { concepto: "Paneles solares", fraccion: 0.38 },
  { concepto: "Inversor", fraccion: 0.18 },
  { concepto: "Estructura de montaje", fraccion: 0.11 },
  { concepto: "Cableado, protecciones y tablero", fraccion: 0.1 },
  { concepto: "Instalación y mano de obra", fraccion: 0.15 },
  { concepto: "Ingeniería, trámites y legalización", fraccion: 0.08 },
];

// ---------------------------------------------------------------------------
// Economía
// ---------------------------------------------------------------------------

export const ECONOMIA = {
  /**
   * Cuánto sube la tarifa de energía al año, por encima de la inflación.
   *
   * Deliberadamente conservador. En Colombia las tarifas han subido bastante
   * más que esto en los últimos años, pero el retorno de una inversión a veinte
   * años no se promete con la subida de un año malo. Con 4% el cálculo aguanta
   * si el mercado se calma, y si sigue subiendo el cliente gana más de lo que
   * se le dijo, que es el lado correcto para equivocarse.
   */
  escaladaTarifaAnual: 0.04,
  /** Pérdida de rendimiento del panel por año. Garantía típica: 80% a 25 años. */
  degradacionAnual: 0.005,
  /** Mantenimiento y limpieza al año, como fracción de la inversión. */
  mantenimientoAnual: 0.01,
  /** Vida útil con la que se proyecta. */
  vidaUtilAnios: 25,
  /**
   * Qué fracción del valor de la energía se recupera por los excedentes que se
   * entregan a la red. No es 1: el crédito se liquida a una tarifa menor que la
   * de compra y hay que consumirlo dentro del período. Por eso conviene
   * dimensionar cerca del consumo y no muy por encima.
   */
  factorExcedentes: 0.6,
};

// ---------------------------------------------------------------------------
// Impacto ambiental
// ---------------------------------------------------------------------------

export const AMBIENTAL = {
  /**
   * Factor de emisión de la red colombiana, en kg de CO₂ equivalente por kWh.
   *
   * Valor UPME para contabilidad de proyectos (0,225 tCO₂eq/MWh). Ojo: circula
   * también la cifra de 164 g/kWh, que es otra cosa —la intensidad promedio de
   * la generación— y no es la que corresponde para calcular emisiones evitadas.
   *
   * La UPME lo republica cada año. Conviene revisarlo en enero.
   */
  factorEmisionKgPorKwh: 0.225,
  anioFactor: 2025,
  /** CO₂ que fija un árbol maduro al año, en kg. Solo para dar escala. */
  co2PorArbolAnio: 21,
  /** Consumo medio de un hogar colombiano al mes, en kWh. */
  consumoHogarMensualKwh: 180,
};

// ---------------------------------------------------------------------------
// Incentivos tributarios
// ---------------------------------------------------------------------------

/**
 * Beneficios de la Ley 1715 de 2014, modificada por la Ley 2099 de 2021.
 *
 * Aplican a quien declara renta —o sea, sobre todo a empresas— y exigen
 * certificación previa de la UPME. Un hogar que no declara renta no aprovecha
 * la deducción, aunque sí la exclusión de IVA sobre los equipos.
 *
 * Esto es información comercial, no asesoría tributaria, y así hay que decirlo.
 */
export const INCENTIVOS = {
  /** Deducción especial de renta sobre el valor de la inversión. */
  deduccionRenta: 0.5,
  /** Tope: la deducción no puede superar esta fracción de la renta líquida. */
  topeRentaLiquida: 0.5,
  /** Años para tomar la deducción. */
  aniosDeduccion: 15,
  /** Tarifa de renta de personas jurídicas, para estimar el ahorro real. */
  tarifaRentaEmpresa: 0.35,
  /** IVA del que quedan excluidos los equipos certificados. */
  iva: 0.19,
  /** Depreciación acelerada anual máxima. */
  depreciacionAcelerada: 0.335,
  vigenteHasta: 2051,
};
