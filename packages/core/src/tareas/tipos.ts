/**
 * Tareas del panel: lo que un proceso automático no pudo terminar solo.
 *
 * La regla que las justifica es una sola, y viene de haberla roto varias veces:
 * **cuando algo automático falla, tiene que quedar un pendiente con dueño.** Un
 * aviso en pantalla que alguien tiene que ver por casualidad no es eso. La
 * factura ilegible que dejó al asistente escribiendo sin datos de consumo, la
 * cotización prometida a 24 horas que nadie recogió, la conversación que se
 * tensó y se quedó en manos de un bot: los tres eran silencios.
 */

/** Qué clase de pendiente es. Determina qué se le pide a quien lo resuelve. */
export type TipoTarea =
  /** No se pudieron extraer los datos de la factura que subió el prospecto. */
  | "recibo"
  /** El asistente pasó la conversación a una persona. */
  | "escalamiento"
  /** Hay que enviarle la propuesta comercial. */
  | "propuesta";

export type EstadoTarea =
  | "pendiente"
  /** Alguien la completó. Si trae datos, ya están donde tienen que estar. */
  | "resuelta"
  /**
   * Se intentó y no se pudo. NO es lo mismo que resuelta ni que pendiente:
   * cambia el comportamiento del asistente, que a partir de aquí le pide el
   * dato al cliente en vez de esperarlo del equipo.
   */
  | "sin_solucion";

export interface Tarea {
  id: number;
  tipo: TipoTarea;
  estado: EstadoTarea;
  titulo: string;
  detalle: string;
  /** Prospecto relacionado, si lo hay. */
  quoteId: number | null;
  /** Conversación de WhatsApp relacionada, si la hay. */
  conversationId: string | null;
  /** Lo que se pide o lo que se entregó, según el tipo. */
  datos: DatosTarea;
  /** Plazo, cuando el tipo lo tiene. La propuesta comercial son 48 horas. */
  venceEn: string | null;
  creadaEn: string;
  resueltaEn: string | null;
  resueltaPor: string | null;
  /** Por qué no se pudo, cuando el estado es `sin_solucion`. */
  nota: string | null;
}

/**
 * Lo que viaja en `datos`, por tipo.
 *
 * Para el recibo son los dos únicos campos que de verdad nos hacen falta de una
 * factura: con el consumo pico se dimensiona y con la dirección se estima la
 * radiación de la zona. El resto —tarifa, estrato, periodo— o se asume o no
 * cambia el resultado preliminar.
 */
export interface DatosTarea {
  /** Ruta del documento que subió el prospecto, para poder abrirlo y leerlo. */
  archivo?: string;
  /** Lo que el modelo sí alcanzó a leer, para no pedirlo de nuevo. */
  leido?: Record<string, string | number>;
  /** Lo que faltó y hay que completar a mano. */
  faltantes?: string[];
  /** Los valores que escribió la persona al resolverla. */
  consumoPicoKwh?: number;
  direccion?: string;
}

export const ETIQUETA_TIPO: Record<TipoTarea, string> = {
  recibo: "Completar datos de la factura",
  escalamiento: "Atender la conversación",
  propuesta: "Enviar propuesta comercial",
};

/**
 * Qué pasa si nadie la atiende. Es lo que decide el orden en pantalla.
 *
 * No es una prioridad configurable a propósito: las tres consecuencias son
 * distintas de verdad y no es cuestión de gusto. Una conversación tensa
 * esperando a una persona se enfría en minutos; una factura ilegible bloquea un
 * primer contacto que todavía no ha salido; una propuesta tiene su plazo y
 * hasta que venza no urge.
 */
export const URGENCIA: Record<TipoTarea, number> = {
  escalamiento: 0,
  recibo: 1,
  propuesta: 2,
};
