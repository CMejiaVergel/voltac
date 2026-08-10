import { currentVertical, type Vertical } from "../vertical";

/**
 * Cliente del asistente de inteligencia artificial.
 *
 * El panel **no lee los archivos del asistente ni comparte base de datos con
 * él**: habla con su API por HTTP. Esa separación es la que permite que cada
 * línea de negocio tenga su propia línea de WhatsApp sin riesgo de cruce —son
 * dos procesos distintos, con dos sesiones distintas, y ninguna aplicación
 * puede alcanzar la del otro aunque alguien se equivoque escribiendo una
 * consulta.
 *
 * Y es lo que hace que el módulo se monte igual en las dos marcas: Energy usa
 * este mismo código sin `ASISTENTE_URL` configurada, así que `disponible()`
 * devuelve false y la interfaz se pinta completa pero inerte. El día que Energy
 * tenga su línea son dos variables de entorno, no una migración.
 *
 * Ambos procesos viven en el mismo servidor y se hablan por loopback, así que
 * el token no viaja por ninguna red. Va igual: si algún día dejan de ser
 * vecinos, el error debe ser de configuración y no de seguridad.
 */

export interface ConfigAsistente {
  url: string;
  token: string;
  vertical: Vertical;
}

/**
 * Configuración de la línea de esta aplicación, o `null` si no tiene.
 *
 * Devolver null en vez de lanzar es intencional: una marca sin asistente
 * configurado no es un error, es el estado normal de Energy hoy.
 */
export function configAsistente(): ConfigAsistente | null {
  const url = process.env.ASISTENTE_URL?.trim();
  const token = process.env.ASISTENTE_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token, vertical: currentVertical() };
}

export function asistenteDisponible(): boolean {
  return configAsistente() !== null;
}

export class AsistenteNoConfigurado extends Error {
  constructor() {
    super(
      "Esta línea de negocio todavía no tiene asistente de WhatsApp configurado.",
    );
    this.name = "AsistenteNoConfigurado";
  }
}

/** Lo que el asistente sabe de un lead una vez lo registró. */
export interface ResumenLead {
  id: string;
  estado: string;
  puntaje?: number;
  prioridad?: string;
  senales: string[];
  toques: number;
  ultimoToqueAt?: number;
  conversationId?: string;
}

export interface RespuestaPreview {
  puedeContactar: boolean;
  /** Por qué no se puede, en lenguaje que se le puede mostrar a una persona. */
  motivo?: string;
  borrador?: string;
  toque?: number;
  lead: ResumenLead;
}

export interface RespuestaEnvio {
  enviado: boolean;
  motivo?: string;
  mensaje?: string;
  toque?: number;
  lead?: ResumenLead;
}

/** El subconjunto de `quotes` que el asistente necesita para escribir. */
export interface LeadParaAsistente {
  crmId: number;
  crmVertical: Vertical;
  fullName: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  requirement?: string | null;
  message?: string | null;
  budget?: string | null;
  source?: string | null;
  projectType?: string | null;
}

/**
 * Los tiempos son distintos según lo que se pida.
 *
 * Redactar un mensaje pasa por el modelo y puede tardar; consultar el estado
 * no. Un tiempo único obligaría a poner el más largo en todo, y una pantalla
 * que se queda colgada treinta segundos por saber si el canal está conectado se
 * siente rota aunque técnicamente funcione.
 */
const ESPERA_MS = { rapida: 8_000, modelo: 45_000 };

async function pedir<T>(
  ruta: string,
  opciones: { metodo?: "GET" | "POST"; cuerpo?: unknown; espera?: number } = {},
): Promise<T> {
  const config = configAsistente();
  if (!config) throw new AsistenteNoConfigurado();

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), opciones.espera ?? ESPERA_MS.rapida);

  try {
    /* El content-type solo va cuando hay cuerpo. Anunciar JSON y no mandar
       nada hace que el servidor intente parsear una cadena vacía y responda
       500: es lo que rompía el botón de devolver la conversación al bot. */
    const r = await fetch(`${config.url}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: {
        authorization: `Bearer ${config.token}`,
        ...(opciones.cuerpo ? { "content-type": "application/json" } : {}),
      },
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: control.signal,
      cache: "no-store",
    });

    const texto = await r.text();
    const datos = texto ? JSON.parse(texto) : {};

    if (!r.ok) {
      throw new Error(datos?.error ?? `El asistente respondió ${r.status}`);
    }
    return datos as T;
  } catch (err) {
    // El caso frecuente y el que más confunde: el proceso del asistente está
    // caído. Sin este mensaje el panel muestra "fetch failed", que no le dice
    // nada a quien está tratando de contactar a un cliente.
    if (err instanceof Error && (err.name === "AbortError" || err.message.includes("fetch"))) {
      throw new Error(
        "No se pudo hablar con el asistente de WhatsApp. Verifica que el proceso esté corriendo.",
      );
    }
    throw err;
  } finally {
    clearTimeout(corte);
  }
}

/** Registra el lead y devuelve el borrador sin enviar nada. */
export function pedirBorrador(lead: LeadParaAsistente): Promise<RespuestaPreview> {
  return pedir<RespuestaPreview>("/crm/contactar/preview", {
    metodo: "POST",
    cuerpo: { lead },
    espera: ESPERA_MS.modelo,
  });
}

/** Envía exactamente el texto aprobado. */
export function enviarMensaje(lead: LeadParaAsistente, texto: string): Promise<RespuestaEnvio> {
  return pedir<RespuestaEnvio>("/crm/contactar/enviar", {
    metodo: "POST",
    cuerpo: { lead, texto },
    espera: ESPERA_MS.modelo,
  });
}

export interface EstadoAsistente {
  canal: string;
  tenant: string;
  pausado: boolean;
  leads: number;
  conversaciones: number;
  esperandoRespuesta: number;
}

export function estadoAsistente(): Promise<EstadoAsistente> {
  return pedir<EstadoAsistente>("/crm/estado");
}

// --- La bandeja ------------------------------------------------------------

/**
 * Red por la que llegó el mensaje.
 *
 * Hoy siempre WhatsApp. El tipo se declara abierto desde ya porque la bandeja
 * pinta el icono a partir de este dato: cuando entren Messenger e Instagram no
 * habrá que tocar la lista, solo añadir el icono.
 */
export type Canal = "whatsapp" | "messenger" | "instagram" | "console";

/** Quién escribió un mensaje del hilo. */
export type Autor = "cliente" | "bot" | "persona";

export interface ConversacionResumen {
  conversationId: string;
  waId: string;
  canal: Canal;
  nombre?: string;
  ultimoMensaje?: string;
  ultimoMensajeDe?: Autor;
  ultimaActividad: number;
  lastInboundAt?: number;
  /** El cliente escribió y nadie ha contestado. */
  esperandoRespuesta: boolean;
  estado: "bot" | "human" | "paused";
  escalado: boolean;
  crmId?: number;
  leadEstado?: string;
  prioridad?: string;
}

export interface Mensaje {
  de: Autor;
  texto: string;
  at: number;
}

export interface AccionRegistrada {
  tipo: string;
  datos?: Record<string, unknown>;
  at: number;
}

export interface ConversacionDetalle {
  conversationId: string;
  waId: string;
  canal: Canal;
  nombre?: string;
  estado: "bot" | "human" | "paused";
  escalado: boolean;
  motivoEscalamiento?: string;
  esperandoRespuesta: boolean;
  /** Resumen de los turnos ya compactados. Lo primero que hay que leer. */
  ficha?: string;
  campos: Record<string, string>;
  mensajes: Mensaje[];
  acciones: AccionRegistrada[];
  lead?: { crmId?: number; estado: string; prioridad?: string; puntaje?: number };
}

export function listarConversaciones(): Promise<{ conversaciones: ConversacionResumen[] }> {
  return pedir("/crm/conversaciones");
}

export function verConversacion(id: string): Promise<ConversacionDetalle> {
  return pedir(`/crm/conversaciones/${encodeURIComponent(id)}`);
}

/** Responde como persona. Pausa el asistente en esa conversación. */
export function responderConversacion(id: string, texto: string): Promise<{ ok: boolean }> {
  return pedir(`/crm/conversaciones/${encodeURIComponent(id)}/responder`, {
    metodo: "POST",
    cuerpo: { texto },
    espera: ESPERA_MS.modelo,
  });
}

export function devolverAlBot(id: string): Promise<{ ok: boolean }> {
  return pedir(`/crm/conversaciones/${encodeURIComponent(id)}/devolver-al-bot`, {
    metodo: "POST",
  });
}

export interface Novedades {
  ahora: number;
  nuevos: number;
  esperandoRespuesta: number;
  conversaciones: { conversationId: string; lastInboundAt?: number }[];
}

export function novedades(desde: number): Promise<Novedades> {
  return pedir(`/crm/novedades?desde=${desde}`);
}
