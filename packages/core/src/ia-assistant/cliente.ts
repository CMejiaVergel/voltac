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
  /**
   * Si adjuntó su recibo de energía al registrarse.
   *
   * Solo lo llena Energy. Sirve para que el primer mensaje no le pida una foto
   * que la persona acaba de subir, que es la forma más rápida de que concluya
   * que del otro lado no hay nadie leyendo.
   */
  reciboAdjunto?: boolean;
  /**
   * Ruta del adjunto, relativa a este sitio.
   *
   * Relativa y no absoluta a propósito: detrás del proxy este proceso solo se
   * ve a sí mismo como localhost, así que una URL construida aquí apuntaría a
   * un host que el asistente no puede resolver. Él sí sabe dónde está el CRM.
   */
  reciboUrl?: string | null;
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
  opciones: { metodo?: "GET" | "POST" | "PUT"; cuerpo?: unknown; espera?: number } = {},
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
  modelo: string;
  pausado: boolean;
  leads: number;
  conversaciones: number;
  /** Escribieron y nadie ha contestado. */
  esperandoRespuesta: number;
  /** Leads que todavía no se han contactado. */
  leadsEnCola: number;
  /** Con un escalamiento vigente. */
  escalados: number;
  /** Donde alguien tomó el control y el asistente calla. */
  enManosDeUnaPersona: number;
  reunionesAgendadas: number;
  /** Con movimiento en las últimas 24 horas. */
  activas: number;
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
  /**
   * Si el mensaje llegó al cliente. Ausente significa que sí.
   *
   * `no_enviado`: el modelo lo escribió acompañando una llamada a herramienta,
   * y eso nunca sale hacia el cliente; solo sale la respuesta final del ciclo.
   * `fallido`: se intentó enviar y WhatsApp no lo entregó.
   */
  entrega?: "no_enviado" | "fallido";
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

// --- Configuración ----------------------------------------------------------

/** Un ejemplo comparado. Es lo que más mueve el tono, más que cualquier regla. */
export interface EjemploTono {
  cliente: string;
  mal: string;
  bien: string;
}

export interface Ajustes {
  pausado: boolean;
  modelo: string;
  /**
   * Quién contesta si el principal no puede: retirado, saturado o sin cuota.
   *
   * Admite varios separados por coma, en orden. Vacío = el del .env.
   */
  modeloRespaldo: string;
  /** Calendario de Google donde el asistente agenda. Vacio = el del .env. */
  calendarioId: string;
  temperatura: number;
  maxTokens: number;
  debounceSegundos: number;
  esperaMaximaSegundos: number;
  maxToques: number;
  esperaDias: number[];
  largoObjetivo: number;
  tratamiento: "tu" | "usted" | "reflejar";
  instruccionExtra: string;
  frasesPropias: string[];
  evitar: string[];
  ejemplos: EjemploTono[];
}

export interface AjustesCompletos {
  ajustes: Ajustes;
  /** Los valores de origen, para poder comparar y volver atrás. */
  origen: Ajustes;
  /** Qué campos se cambiaron a mano. El resto viene del entorno. */
  modificados: string[];
  /**
   * Modelos que ya tienen perfil calibrado.
   *
   * Cada modelo guarda el suyo: temperatura, largo, trato, ejemplos. Volver a
   * uno ya probado restaura exactamente lo que se dejó, y tocar otro no lo
   * afecta. Lo operativo —pausa, ritmo, insistencia— es común a todos.
   */
  modelosConPerfil: string[];
}

export function traerAjustes(): Promise<AjustesCompletos> {
  return pedir("/crm/ajustes");
}

export function escribirAjustes(patch: Partial<Ajustes>): Promise<{ ajustes: Ajustes }> {
  return pedir("/crm/ajustes", { metodo: "PUT", cuerpo: patch });
}

export function restaurarAjustes(): Promise<{ ajustes: Ajustes }> {
  return pedir("/crm/ajustes/restaurar", { metodo: "POST" });
}

/** El prompt tal como lo recibe el modelo ahora mismo. */
export function verPrompt(): Promise<{ prompt: string; herramientas: string[]; caracteres: number }> {
  return pedir("/crm/prompt", { espera: ESPERA_MS.modelo });
}

// --- Agenda, métricas y catálogo --------------------------------------------

/**
 * Un evento del calendario, ya normalizado.
 *
 * El tipo es deliberadamente agnóstico del proveedor. Hoy todo viene de Google,
 * pero el día que entren Outlook y Teams la pantalla no cambia: `origen` dice de
 * dónde salió cada uno y el resto de la forma es la misma.
 */
export interface EventoAgenda {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  todoElDia: boolean;
  descripcion?: string;
  ubicacion?: string;
  enlace?: string;
  asistentes: string[];
  origen: "google";
  /** Lo creó el asistente, no una persona. */
  delAsistente: boolean;
}

export interface Agenda {
  zonaHoraria: string;
  calendario: string;
  eventos: EventoAgenda[];
}

export function traerAgenda(dias = 14): Promise<Agenda> {
  return pedir(`/crm/agenda?dias=${dias}`, { espera: ESPERA_MS.modelo });
}

export interface Metricas {
  desde: number;
  hasta: number;
  turnos: number;
  conversaciones: number;
  tokens: number;
  costoUsd: number;
  costoPorTurno: number;
  msPromedio: number;
  msMaximo: number;
  errores: number;
  escalamientos: number;
  citasAgendadas: number;
  leadsContactados: number;
  respuestasHumanas: number;
  herramientas: { nombre: string; veces: number }[];
  porDia: {
    dia: string;
    turnos: number;
    costoUsd: number;
    tokens: number;
    entrantes: number;
    citas: number;
  }[];
  /** A qué hora escribe la gente. 24 posiciones, hora de Colombia. */
  porHora: { hora: number; mensajes: number }[];
  /** Reparto de eventos por tipo: en qué se le va el tiempo al asistente. */
  reparto: { tipo: string; veces: number }[];
  /** Contactados → respondieron → agendaron. */
  embudo: { etapa: string; cantidad: number }[];
  masCaras: { conversationId: string; turnos: number; costoUsd: number }[];
  saldoUsd?: number;
}

export function traerMetricas(dias = 30): Promise<Metricas> {
  return pedir(`/crm/metricas?dias=${dias}`, { espera: ESPERA_MS.modelo });
}

export interface ModeloDisponible {
  id: string;
  nombre: string;
  /** USD por millón de tokens. `null` cuando el precio es variable. */
  entradaPorMillon: number | null;
  salidaPorMillon: number | null;
  contexto: number;
  gratis: boolean;
}

export function traerModelos(): Promise<{ modelos: ModeloDisponible[] }> {
  return pedir("/crm/modelos", { espera: ESPERA_MS.modelo });
}

export interface Vinculacion {
  /** `false` en la Cloud API de Meta, que no se pareja con QR. */
  soportado: boolean;
  estado: "iniciando" | "esperando-qr" | "conectando" | "conectado" | "desvinculado" | "caido";
  /** Imagen lista para pintar. Llega ya como data URI desde el asistente. */
  qrImagen?: string;
  /** Lo que le queda de vida al QR. WhatsApp lo rota cada 20 segundos. */
  qrValidoSeg?: number;
  numero?: string;
  nombre?: string;
  conectadoDesde?: number;
  detalle?: string;
}

export function traerVinculacion(): Promise<Vinculacion> {
  return pedir("/crm/vinculacion");
}

/**
 * Desvincula la línea y arranca un pareo nuevo.
 *
 * Deja al asistente mudo hasta que alguien escanee el QR. La contraseña se
 * comprueba antes, en el sitio web; aquí ya llega autorizado.
 */
export function revincularLinea(): Promise<{ ok: true; archivadoEn?: string }> {
  return pedir("/crm/vinculacion/revincular", { metodo: "POST" });
}

export interface SolicitudCita {
  id: string;
  conversationId: string;
  nombre?: string;
  correo?: string;
  tipo: "mover" | "cancelar";
  /** Lo que pidió el cliente, en sus términos. */
  pedido: string;
  cuandoPropone?: string;
  /** Si esa franja estaba libre según el calendario, cuando se consultó. */
  franjaLibre?: boolean;
  estado: "pendiente" | "resuelta" | "rechazada";
  creadaEn: number;
  resueltaEn?: number;
  resueltaPor?: string;
}

export function traerSolicitudes(soloPendientes = false): Promise<{ solicitudes: SolicitudCita[] }> {
  return pedir(`/crm/solicitudes${soloPendientes ? "?pendientes=1" : ""}`);
}

/**
 * Marca la petición y le avisa al cliente.
 *
 * El aviso sale como mensaje del asistente y NO toma la conversación: el
 * cliente espera una confirmación, no que aparezca una persona.
 */
export function resolverSolicitud(
  id: string,
  como: "resuelta" | "rechazada",
  mensaje: string,
  quien?: string,
): Promise<{ ok: true; solicitud: SolicitudCita }> {
  return pedir(`/crm/solicitudes/${encodeURIComponent(id)}/resolver`, {
    metodo: "POST",
    cuerpo: { como, mensaje, quien },
  });
}

export interface EstadoGoogle {
  conectado: boolean;
  /** Qué cuenta, no solo si hay una. En esa agenda caen las reuniones. */
  cuenta?: string;
  calendario: string;
  /** Los de esa cuenta donde se puede escribir. Vacio si no esta conectado. */
  calendarios: { id: string; nombre: string; principal: boolean }[];
  zona: string;
  /** A dónde mandar al navegador para autorizar. */
  urlConsentimiento?: string;
  /** Por qué no se pudo preparar el enlace, si no se pudo. */
  motivo?: string;
  /** La que hay que registrar en Google Cloud. Se muestra si falla el retorno. */
  redirectUri: string;
}

export function traerGoogle(redirectUri: string): Promise<EstadoGoogle> {
  return pedir(`/crm/google?redirectUri=${encodeURIComponent(redirectUri)}`);
}

export function canjearCodigoGoogle(
  code: string,
  redirectUri: string,
): Promise<{ ok: true; cuenta?: string }> {
  return pedir("/crm/google/canjear", { metodo: "POST", cuerpo: { code, redirectUri } });
}

/** Borra una conversación entera. No se puede deshacer. */
export function limpiarConversacion(id: string): Promise<{
  turnos: number;
  /** El gasto no se borra: se conserva sin nada que identifique a la persona. */
  eventosAnonimizados: number;
  ficha: boolean;
  leadReiniciado?: string;
}> {
  return pedir(`/crm/conversaciones/${encodeURIComponent(id)}/limpiar`, { metodo: "POST" });
}
