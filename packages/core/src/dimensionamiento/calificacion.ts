/**
 * Qué tan buen prospecto es quien está preguntando.
 *
 * En fotovoltaica entra mucha gente a preguntar precios. Casi todas las
 * consultas son legítimas y casi ninguna termina en venta, y atenderlas todas
 * con una reunión de agenda gasta el recurso más escaso que tiene una empresa
 * pequeña: el tiempo del que vende. Esto decide a quién se le ofrece reunión y
 * a quién se le da una buena asesoría y se le deja la puerta abierta.
 *
 * Es determinista y está separado del motor a propósito. Dos cosas distintas se
 * confunden con facilidad:
 *
 *  - `retorno.calificacion` dice si el PROYECTO es buena inversión.
 *  - esto dice si la PERSONA está en posición de hacerla.
 *
 * No son lo mismo. Un hogar de estrato bajo puede tener un proyecto con retorno
 * de siete años —perfectamente sano— y aun así no ser un prospecto, porque el
 * problema no es el retorno sino los seis millones de entrada. Y al revés: una
 * empresa con un retorno mediocre puede ser el mejor prospecto del mes porque
 * lo que busca es respaldo y tiene con qué pagarlo.
 *
 * Nada de esto lo decide el modelo de lenguaje. El asistente recoge señales,
 * llama aquí y obedece el resultado.
 */

import type { ResultadoDimensionamiento } from "./motor";

export interface SenalesProspecto {
  /** El dimensionamiento ya calculado. Es la base de casi todo el puntaje. */
  resultado: ResultadoDimensionamiento;
  /** Si es dueño del inmueble. Un arrendatario rara vez puede decidir. */
  esPropietario?: boolean;
  /** Preguntó por cotización formal, no solo por un aproximado. */
  pidioCotizacion?: boolean;
  /** Habló de plata: presupuesto, crédito, financiación. */
  mencionoPresupuesto?: boolean;
  /** Preguntó por financiación. En este negocio es la señal más fuerte. */
  preguntoFinanciacion?: boolean;
  cuandoLoHaria?: "ya" | "este-ano" | "explorando";
  /** Si viene de un formulario del sitio y no de un mensaje en frío. */
  vieneDeFormulario?: boolean;
}

export type NivelProspecto = "caliente" | "tibio" | "frio" | "no-calificado";

export interface CalificacionProspecto {
  puntaje: number;
  nivel: NivelProspecto;
  /** Lo único que el asistente necesita mirar para decidir. */
  ofrecerReunion: boolean;
  /** Desglose, para que en el panel se vea por qué salió lo que salió. */
  factores: { factor: string; puntos: number; de: number; nota: string }[];
  /** Qué preguntar para afinar. El asistente lo usa para seguir conversando. */
  faltaPorSaber: string[];
  /** Cómo debe tratarlo el asistente a partir de aquí. */
  recomendacion: string;
}

/** A partir de aquí se ofrece reunión. */
const UMBRAL_REUNION = 50;

export function calificarProspecto(s: SenalesProspecto): CalificacionProspecto {
  const { resultado: r } = s;
  const factores: CalificacionProspecto["factores"] = [];
  const faltaPorSaber: string[] = [];

  // --- Tamaño del negocio (0-35) --------------------------------------------
  //
  // El predictor más fuerte, y de lejos. No por codicia: un consumo alto
  // significa a la vez una factura que duele, capacidad de pago demostrada y
  // un sistema donde los costos fijos del proyecto pesan poco. Los tres
  // empujan en la misma dirección.
  const kwh = r.entrada.consumoMensualKwh;
  let pTamano: number;
  let notaTamano: string;
  if (kwh >= 5000) {
    pTamano = 35;
    notaTamano = "Consumo industrial. Es el perfil donde el proyecto se paga solo más rápido.";
  } else if (kwh >= 2000) {
    pTamano = 30;
    notaTamano = "Consumo de empresa mediana. Muy buen tamaño de proyecto.";
  } else if (kwh >= 800) {
    pTamano = 23;
    notaTamano = "Consumo de comercio o casa grande. Proyecto de tamaño interesante.";
  } else if (kwh >= 400) {
    pTamano = 14;
    notaTamano = "Consumo residencial alto. Proyecto viable, de margen ajustado.";
  } else if (kwh >= 200) {
    pTamano = 7;
    notaTamano = "Consumo residencial medio. Proyecto pequeño.";
  } else {
    pTamano = 2;
    notaTamano = "Consumo bajo. El sistema sale pequeño y el ahorro mensual apenas se nota.";
  }
  factores.push({ factor: "Tamaño del consumo", puntos: pTamano, de: 35, nota: notaTamano });

  // --- Retorno de la inversión (0-25) ---------------------------------------
  const anios = r.retorno.anios;
  let pRetorno: number;
  let notaRetorno: string;
  if (anios === null) {
    pRetorno = 0;
    notaRetorno = "El sistema no se paga dentro de su vida útil. No hay argumento económico.";
  } else if (anios < 4) {
    pRetorno = 25;
    notaRetorno = `Se paga en ${anios} años. Es un argumento de venta por sí solo.`;
  } else if (anios < 6) {
    pRetorno = 20;
    notaRetorno = `Se paga en ${anios} años. Buen argumento.`;
  } else if (anios < 8) {
    pRetorno = 13;
    notaRetorno = `Se paga en ${anios} años. Defendible, pero hay que sostenerlo con otra cosa.`;
  } else if (anios < 12) {
    pRetorno = 6;
    notaRetorno = `Se paga en ${anios} años. Cuesta justificarlo solo con el ahorro.`;
  } else {
    pRetorno = 0;
    notaRetorno = `Se paga en ${anios} años. Más que eso es difícil de defender de frente.`;
  }
  factores.push({ factor: "Retorno de la inversión", puntos: pRetorno, de: 25, nota: notaRetorno });

  // --- Tipo de cliente (0-15) -----------------------------------------------
  //
  // Una empresa deduce el 50% de la inversión de la renta y deprecia acelerado.
  // Un hogar que no declara no aprovecha nada de eso: paga lo mismo y recupera
  // solo por la factura.
  const tipo = r.entrada.tipoCliente;
  const pCliente = tipo === "industrial" ? 15 : tipo === "comercial" ? 12 : 4;
  factores.push({
    factor: "Tipo de cliente",
    puntos: pCliente,
    de: 15,
    nota:
      tipo === "residencial"
        ? "Hogar: no aprovecha la deducción de renta ni la depreciación acelerada."
        : "Declara renta: accede a la deducción del 50% y a la depreciación acelerada.",
  });

  // --- Señales de intención (0-25) ------------------------------------------
  //
  // Lo que la persona hace, no lo que dice. Preguntar por financiación es la
  // señal más fuerte de todas: nadie averigua cómo pagar algo que no piensa
  // comprar.
  let pIntencion = 0;
  const notasIntencion: string[] = [];

  if (s.preguntoFinanciacion) {
    pIntencion += 9;
    notasIntencion.push("preguntó por financiación");
  }
  if (s.pidioCotizacion) {
    pIntencion += 6;
    notasIntencion.push("pidió cotización formal");
  }
  if (s.mencionoPresupuesto) {
    pIntencion += 4;
    notasIntencion.push("habló de presupuesto");
  }
  if (s.cuandoLoHaria === "ya") {
    pIntencion += 6;
    notasIntencion.push("lo quiere hacer ya");
  } else if (s.cuandoLoHaria === "este-ano") {
    pIntencion += 3;
    notasIntencion.push("lo tiene previsto para este año");
  } else if (s.cuandoLoHaria === "explorando") {
    notasIntencion.push("está explorando");
  }
  if (s.vieneDeFormulario) {
    pIntencion += 2;
    notasIntencion.push("dejó sus datos en el sitio");
  }

  pIntencion = Math.min(25, pIntencion);
  factores.push({
    factor: "Señales de intención",
    puntos: pIntencion,
    de: 25,
    nota: notasIntencion.length ? notasIntencion.join("; ") : "Todavía no ha dado ninguna señal de compra.",
  });

  // --- Descuento por no poder decidir ---------------------------------------
  //
  // No suma: resta. Alguien que no es dueño del techo puede tener el mejor
  // proyecto del mundo y no poder autorizarlo.
  let puntaje = pTamano + pRetorno + pCliente + pIntencion;
  if (s.esPropietario === false) {
    puntaje = Math.round(puntaje * 0.5);
    factores.push({
      factor: "No es propietario",
      puntos: -Math.round(puntaje),
      de: 0,
      nota: "No puede autorizar una instalación sobre un inmueble que no es suyo. Hay que llegar a quien decide.",
    });
  }

  // --- Qué falta por preguntar ----------------------------------------------
  if (s.esPropietario === undefined) faltaPorSaber.push("Si el inmueble es propio o arrendado.");
  if (s.cuandoLoHaria === undefined) faltaPorSaber.push("Para cuándo lo tiene pensado.");
  if (!s.preguntoFinanciacion && !s.mencionoPresupuesto) {
    faltaPorSaber.push("Si lo haría de contado o con financiación.");
  }
  if (r.entrada.areaDisponibleM2 === null) {
    faltaPorSaber.push(`Cuánta área de techo tiene libre (el sistema necesita unos ${r.sistema.areaRequeridaM2} m²).`);
  }

  const nivel = nivelDe(puntaje);
  const ofrecerReunion = puntaje >= UMBRAL_REUNION;

  return {
    puntaje,
    nivel,
    ofrecerReunion,
    factores,
    faltaPorSaber,
    recomendacion: recomendar(nivel, faltaPorSaber),
  };
}

function nivelDe(puntaje: number): NivelProspecto {
  if (puntaje >= 70) return "caliente";
  if (puntaje >= UMBRAL_REUNION) return "tibio";
  if (puntaje >= 28) return "frio";
  return "no-calificado";
}

function recomendar(nivel: NivelProspecto, falta: string[]): string {
  switch (nivel) {
    case "caliente":
      return (
        "Ofrécele la reunión ya, sin dar más vueltas. Tiene tamaño, retorno y ganas: " +
        "cada mensaje de más es una oportunidad de que se enfríe."
      );
    case "tibio":
      return (
        "Ofrécele la reunión, pero primero termina de responderle lo que preguntó. " +
        (falta.length ? `Antes de cerrar conviene aclarar: ${falta[0]?.toLowerCase()}` : "")
      );
    case "frio":
      return (
        "Todavía no le ofrezcas reunión. Dale la asesoría completa y bien hecha, resuélvele las dudas " +
        "y deja la puerta abierta. Si en la conversación aparece una señal de compra —financiación, " +
        "una fecha, un presupuesto— vuelve a calificar y ahí sí."
      );
    case "no-calificado":
      return (
        "No le ofrezcas reunión. Respóndele con generosidad lo que preguntó, explícale por qué en su " +
        "caso el proyecto es pequeño y sé honesto con eso: la gente lo agradece y recomienda. " +
        "Invítalo a volver a escribir si su consumo cambia."
      );
  }
}
