/**
 * Dónde está cada dato en la factura de energía.
 *
 * Este archivo existe porque el dato que hunde un dimensionamiento no es el que
 * falta: es el que se puso mal. La confusión clásica es el precio del
 * kilovatio hora. En la factura aparece el TOTAL a pagar en letra grande y el
 * costo unitario en letra pequeña dentro de una tabla de seis renglones; quien
 * escribe el total en la casilla del kWh obtiene un estudio con un retorno de
 * seis meses que parece perfectamente serio.
 *
 * Y cada operador lo llama distinto. EPM dice "CU", Air-e desglosa "Costo
 * Unitario ($/kWh)", Afinia lo mete en "Liquidación del servicio", Emcali en
 * "Componentes del costo". Un texto genérico que diga "busque el costo
 * unitario" no le sirve a quien tiene la factura de Afinia en la mano.
 */

export interface AyudaCampo {
  campo: string;
  titulo: string;
  /** Qué es, en una frase, para quien nunca ha leído una factura de energía. */
  queEs: string;
  /** Dónde mirar, por operador. */
  donde: { operador: string; instruccion: string }[];
  /** Cómo salir del paso si no aparece. */
  alternativa?: string;
  /** El error que de verdad comete la gente. */
  cuidado?: string;
}

export const AYUDA_RECIBO: readonly AyudaCampo[] = [
  {
    campo: "consumoMensualKwh",
    titulo: "Consumo mensual en kWh",
    queEs:
      "Cuánta energía gasta al mes. Es el número que la empresa mide en el contador y por el que cobra.",
    donde: [
      {
        operador: "EPM",
        instruccion:
          'En el recuadro "Energía", renglón "Consumo kWh". Al lado suele venir la gráfica de barras de los últimos seis meses.',
      },
      {
        operador: "Air-e",
        instruccion:
          'En "Información del consumo", casilla "Consumo activo kWh". La gráfica del histórico va debajo.',
      },
      {
        operador: "Afinia",
        instruccion: 'En "Detalle del consumo", renglón "Consumo del período (kWh)".',
      },
      {
        operador: "Emcali",
        instruccion: 'En "Energía", renglón "Consumo facturado kWh".',
      },
      {
        operador: "Enel / Celsia / ESSA / CENS / EBSA",
        instruccion:
          'Búsquelo como "Consumo (kWh)" o "Energía activa". Está siempre junto a las lecturas del medidor anterior y actual.',
      },
    ],
    alternativa:
      "Si no lo encuentra: la diferencia entre la lectura actual y la anterior del medidor son los kWh del período.",
    cuidado:
      "Use el PROMEDIO de varios meses, no el de uno solo. Casi todas las facturas traen la gráfica de los últimos seis: sume y divida. Un mes de vacaciones o un diciembre desvían el sistema entero.",
  },
  {
    campo: "precioKwh",
    titulo: "Precio del kWh (Costo Unitario)",
    queEs:
      "Lo que le cuesta cada kilovatio hora, con todo incluido: generación, transmisión, distribución, comercialización, pérdidas y restricciones.",
    donde: [
      {
        operador: "EPM",
        instruccion:
          'En "Componentes del costo", el renglón "CU". Es la suma de G + T + D + C + PR + R, que aparecen justo encima.',
      },
      {
        operador: "Air-e",
        instruccion: 'En el cuadro de liquidación, columna "Costo Unitario ($/kWh)".',
      },
      {
        operador: "Afinia",
        instruccion: 'En "Liquidación del servicio", renglón "CU - Costo Unitario".',
      },
      {
        operador: "Emcali",
        instruccion:
          'En "Componentes del costo": Generación, Transmisión, Comercialización, Distribución, Pérdidas y Restricciones. El CU es la suma; suele venir ya totalizado abajo.',
      },
      {
        operador: "Cualquiera",
        instruccion: 'Busque las siglas "CU" o el texto "$/kWh". Es un número de tres o cuatro cifras.',
      },
    ],
    alternativa:
      "Si no lo encuentra, divida el valor cobrado por consumo entre los kWh consumidos. Da prácticamente lo mismo.",
    cuidado:
      "NO ponga aquí el total de la factura. En Colombia el kWh va entre $400 y $1.500; si escribe un número de cinco o seis cifras, el estudio saldrá con un retorno absurdamente bueno y no se va a notar a simple vista.",
  },
  {
    campo: "tipoCliente",
    titulo: "Tipo de cliente",
    queEs:
      "Si el servicio es residencial, comercial o industrial. Cambia la tarifa, los subsidios y —sobre todo— si el cliente puede deducir la inversión de la renta.",
    donde: [
      {
        operador: "Cualquiera",
        instruccion:
          'En la cabecera de la factura, junto a la dirección. Dice "Estrato 1..6" si es residencial, o "Comercial", "Industrial" u "Oficial" si no lo es.',
      },
    ],
    cuidado:
      "Un estrato residencial bajo recibe subsidio, así que paga el kWh más barato: el ahorro es menor y el retorno más largo. Los estratos 5 y 6 pagan contribución —más caro que el costo real— y por eso les rinde más.",
  },
  {
    campo: "region",
    titulo: "Región",
    queEs:
      "Dónde queda la instalación. Determina cuántas horas de sol útil recibe al día, y es el dato que más desvía un dimensionamiento.",
    donde: [
      {
        operador: "Cualquiera",
        instruccion: "La dirección de la factura, si el sistema va donde llega el recibo.",
      },
    ],
    cuidado:
      "Entre La Guajira y el Chocó hay más de un 50% de diferencia en radiación. El mismo consumo necesita 12 paneles en Riohacha y 18 en Quibdó.",
  },
  {
    campo: "tipoTecho",
    titulo: "Tipo de cubierta",
    queEs:
      "Sobre qué se van a montar los paneles. Cambia el costo de la estructura y, más importante, cuánta área hace falta.",
    donde: [
      { operador: "No está en la factura", instruccion: "Hay que preguntarlo o verlo en una foto." },
    ],
    cuidado:
      "En losa plana los paneles van inclinados con estructura y hay que dejar pasillo entre filas para que no se den sombra: ocupan casi el doble de área que sobre teja.",
  },
  {
    campo: "areaDisponibleM2",
    titulo: "Área de techo disponible",
    queEs: "Metros cuadrados libres, sin tanques, antenas, claraboyas ni sombra de edificios vecinos.",
    donde: [
      {
        operador: "No está en la factura",
        instruccion:
          "Con la dirección se mide en Google Maps con la herramienta de medir área. Sirve para un primer aproximado.",
      },
    ],
    alternativa: "Si no se sabe, déjelo vacío: el estudio se hace igual y no avisará si no cabe.",
  },
];

export function ayudaDe(campo: string): AyudaCampo | undefined {
  return AYUDA_RECIBO.find((a) => a.campo === campo);
}
