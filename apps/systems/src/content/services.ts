import {
  Compass,
  Workflow,
  MessagesSquare,
  Blocks,
  BarChart3,
  Globe,
  Gauge,
  Scale,
  Factory,
  Store,
  HeartPulse,
  GraduationCap,
  Truck,
  Building2,
  Landmark,
  type LucideIcon,
} from "lucide-react";

/**
 * Fuente única de verdad del portafolio comercial (Portafolio de Servicios 2026).
 * Todo el sitio público (home, /servicios, /cotizar, footer, JSON-LD) lee de aquí:
 * si cambia el portafolio, se edita este archivo y no las pantallas.
 */

export interface Service {
  /** Numeración comercial del portafolio: 01 … 07 */
  number: string;
  /** Ancla estable para enlaces profundos y futuras páginas por servicio */
  slug: string;
  title: string;
  /** Título corto para menús, selects y tarjetas compactas */
  shortTitle: string;
  /** Frase de apertura del servicio en el portafolio */
  quote: string;
  description: string;
  /** "Así se ve en la práctica" — beneficios en lenguaje del cliente */
  practice: string[];
  /** Detalle técnico (Anexo A). Se muestra como información de respaldo. */
  technical: string;
  icon: LucideIcon;
}

export const SERVICES: Service[] = [
  {
    number: "01",
    slug: "diagnostico-consultoria-formacion",
    title: "Diagnóstico, consultoría y formación",
    shortTitle: "Diagnóstico y consultoría",
    quote: "Antes de invertir en tecnología, hay que saber dónde se está yendo el dinero.",
    description:
      "Todo empieza aquí. Nos sentamos con usted y su equipo, miramos cómo trabajan hoy y le decimos con franqueza qué tareas se están comiendo las horas, cuánto le cuestan al año y cuáles se pueden resolver primero porque se pagan solas. Salimos con un plan ordenado: qué hacer, en qué orden y qué resultado esperar. Y si su equipo quiere aprender a usar estas herramientas por su cuenta, lo formamos con ejercicios de su propio trabajo.",
    practice: [
      "Revisión de la operación y de las tareas que más tiempo consumen",
      "Un plan a 90 días, ordenado por lo que da resultado más rápido",
      "Cálculo de cuánto tiempo y dinero se recupera en cada caso",
      "Capacitación práctica al equipo, con ejemplos de su día a día",
      "Acompañamiento posterior para que los cambios se sostengan",
    ],
    technical:
      "Levantamiento y documentación de procesos, medición de la carga operativa y del costo por tarea, priorización de iniciativas por retorno, plan de implementación por etapas, definición de indicadores de resultado y programas de capacitación por área y por rol.",
    icon: Compass,
  },
  {
    number: "02",
    slug: "automatizacion-trabajo-repetitivo",
    title: "Automatización del trabajo repetitivo",
    shortTitle: "Automatización de tareas",
    quote:
      "Su gente no necesita trabajar más horas: necesita dejar de hacer lo que una máquina hace mejor.",
    description:
      "Toda organización tiene tareas que se repiten todos los días y que no requieren criterio profesional: copiar datos de un lado a otro, armar el mismo documento cambiando nombres, revisar correos, llenar formatos, pasar información de una hoja a otra. Nosotros hacemos que esas tareas se hagan solas. El profesional deja de ser digitador y vuelve a hacer lo que sabe hacer.",
    practice: [
      "Derecho: elaboración de escritos y contratos con los formatos propios de la firma, revisión de documentos extensos y búsqueda dentro de expedientes",
      "Contabilidad y tributaria: lectura de facturas y soportes, clasificación automática y armado de informes periódicos",
      "Asesoría financiera: consolidación de cifras de distintas fuentes y generación de informes para el cliente",
      "Salud: transcripción de notas, historias y resúmenes de atención",
      "Comercio y distribución: cotizaciones, pedidos, remisiones y control de inventario",
      "En trabajo documental, una tarea de dos horas puede quedar resuelta en minutos",
    ],
    technical:
      "Diseño y puesta en marcha de flujos de trabajo automáticos, integración entre sistemas que hoy operan separados, lectura y clasificación automática de documentos, generación de documentos a partir de plantillas propias, reglas de negocio y circuitos de aprobación. Incluye la opción de operar con modelos privados de inteligencia artificial, alojados en infraestructura propia, cuando se manejan datos sensibles o sujetos a reserva profesional.",
    icon: Workflow,
  },
  {
    number: "03",
    slug: "atencion-automatica-clientes",
    title: "Atención automática de clientes, 24 horas",
    shortTitle: "Atención 24 horas",
    quote: "Cada mensaje sin responder es una venta que se va con la competencia.",
    description:
      "Instalamos un asistente que atiende a sus clientes por WhatsApp, redes o su página web a cualquier hora, incluso de madrugada y en festivos. No es un menú de opciones: entiende lo que le preguntan y responde con la información real de su negocio. Cuando el caso necesita una persona, le pasa la conversación a su equipo con todo el contexto listo.",
    practice: [
      "Responde preguntas frecuentes, precios y disponibilidad sin intervención humana",
      "Agenda citas y consultas directamente en el calendario",
      "Toma pedidos y arma cotizaciones",
      "Filtra quién es un cliente serio y quién solo está preguntando",
      "Le avisa a su equipo cuando hay que intervenir",
      "Deja registro de cada conversación y de qué se está preguntando más",
    ],
    technical:
      "Asistentes conversacionales con inteligencia artificial sobre canales oficiales de mensajería, redes sociales y sitio web; base de conocimiento propia de cada organización; conexión con sistemas de gestión comercial; escalamiento a personal humano; registro y medición de todas las conversaciones.",
    icon: MessagesSquare,
  },
  {
    number: "04",
    slug: "programas-y-aplicaciones-a-la-medida",
    title: "Programas y aplicaciones hechos a su medida",
    shortTitle: "Programas a la medida",
    quote: "Cuando la operación ya no cabe en hojas de cálculo, es hora de una herramienta propia.",
    description:
      "Cuando ningún programa del mercado se ajusta a cómo trabaja su organización, se lo construimos. Una herramienta pensada para su proceso real, no para el proceso del vecino: con los permisos que usted define, la información que necesita ver y la posibilidad de crecer después sin empezar de cero.",
    practice: [
      "Sistemas internos de gestión, control y seguimiento",
      "Portales donde sus clientes consultan su propia información sin llamar",
      "Aplicaciones para el personal en calle o en campo",
      "Cobros y pagos en línea",
      "Conexión con los programas que la empresa ya usa, para no duplicar trabajo",
      "Entregas parciales cada dos semanas para ir viendo y ajustando",
    ],
    technical:
      "Desarrollo de sistemas de gestión, portales de autoconsulta para clientes, aplicaciones para personal en campo y módulos de recaudo en línea. Incluye control de accesos por perfiles, registro de auditoría, alojamiento en la nube, respaldo de información y mantenimiento posterior.",
    icon: Blocks,
  },
  {
    number: "05",
    slug: "informacion-ordenada-para-decidir",
    title: "Información ordenada para decidir mejor",
    shortTitle: "Información para decidir",
    quote: "Decisiones con números, no con corazonadas.",
    description:
      "En la mayoría de las organizaciones la información está regada: un poco en cuadernos, un poco en archivos y bastante en la cabeza de dos o tres personas. Nosotros la reunimos en un solo lugar confiable y la presentamos de forma que se entienda de una mirada. Además, dejamos que usted le pueda preguntar a esa información en palabras normales y obtener la respuesta al instante.",
    practice: [
      "Un tablero único con las cifras que de verdad importan",
      "Informes que se generan y se envían solos cada semana o cada mes",
      "Preguntar en lenguaje corriente sobre sus propios documentos y contratos",
      "Alertas cuando algo se sale de lo normal",
      "Proyecciones de demanda, consumo o riesgo con base en su historia",
      "Menos tiempo armando informes y más tiempo decidiendo",
    ],
    technical:
      "Consolidación de información proveniente de distintas fuentes, tableros de control actualizados de forma automática, informes periódicos programados, consulta de documentos internos en lenguaje natural, proyecciones a partir de datos históricos y alertas por desviaciones.",
    icon: BarChart3,
  },
  {
    number: "06",
    slug: "presencia-digital-y-clientes",
    title: "Presencia digital y consecución de clientes",
    shortTitle: "Presencia digital",
    quote: "Si no lo encuentran, no existe. Y si lo encuentran y no convence, tampoco.",
    description:
      "Construimos la cara pública de su organización y el motor que le trae interesados. No páginas bonitas que nadie visita: sitios pensados para que el que llega termine escribiéndole. Y si necesita salir a buscar clientes, montamos el sistema que mantiene conversaciones nuevas cada semana sin que usted tenga que hacerlo a mano.",
    practice: [
      "Página web o catálogo pensado para generar solicitudes, no solo para mostrar",
      "Que su empresa aparezca cuando la buscan en internet y en los asistentes de IA",
      "Contacto ordenado y automático con clientes potenciales",
      "Seguimiento a cada interesado hasta que se concrete la reunión",
      "Medición de por dónde están llegando los clientes y cuáles valen la pena",
    ],
    technical:
      "Desarrollo de sitios web y páginas orientadas a conversión, optimización para buscadores y para asistentes de inteligencia artificial, medición de tráfico y de origen de las solicitudes, y sistemas automatizados de contacto y seguimiento a clientes potenciales.",
    icon: Globe,
  },
  {
    number: "07",
    slug: "operaciones-y-cumplimiento",
    title: "Digitalización de operaciones y cumplimiento normativo",
    shortTitle: "Operaciones y cumplimiento",
    quote: "Lo que no se mide, se paga. Y lo que no se reporta a tiempo, se multa.",
    description:
      "Es nuestra especialidad de origen: venimos de la industria y conocemos la planta, el equipo y la norma. Ponemos ojos digitales sobre la operación —medición remota, seguimiento en vivo, réplicas digitales de las instalaciones— y automatizamos la información que las entidades de control exigen, para que cumplir deje de ser una carrera contra el reloj cada mes.",
    practice: [
      "Medición remota de equipos, consumos y variables de operación",
      "Ver en tiempo real qué está pasando en planta, desde cualquier lugar",
      "Reportes a entidades de control armados automáticamente y a tiempo",
      "Avisos anticipados de vencimientos y de mantenimientos requeridos",
      "Historial completo y verificable de cada dato reportado",
      "Menos sanciones, menos paradas imprevistas y menos horas de escritorio",
    ],
    technical:
      "Instalación de equipos de medición y transmisión remota de datos, conexión con maquinaria y equipos industriales existentes, desarrollo de electrónica a la medida cuando el proyecto lo requiere, representación digital de instalaciones con seguimiento en vivo, trazabilidad documental y elaboración automática de reportes ante entidades de control.",
    icon: Gauge,
  },
];

/** Cuatro compromisos de la compañía (sección "La compañía" del portafolio). */
export const PILLARS = [
  {
    title: "Resultados en semanas",
    description: "Entregas que se pueden probar cada dos semanas.",
  },
  {
    title: "Hablamos claro",
    description: "Conversaciones sobre resultados, no sobre tecnología.",
  },
  {
    title: "Primero lo que se paga solo",
    description: "Empezamos por la mejora de retorno más rápido.",
  },
  {
    title: "Sin quedar amarrado",
    description: "Documentamos y capacitamos para que su equipo sea autónomo.",
  },
];

export interface Sector {
  name: string;
  description: string;
  icon: LucideIcon;
}

export const SECTORS: Sector[] = [
  {
    name: "Servicios profesionales",
    description:
      "Firmas de abogados, contadores, asesores tributarios y financieros: documentos, informes y revisiones que hoy toman horas.",
    icon: Scale,
  },
  {
    name: "Industria y manufactura",
    description:
      "Plantas, metalmecánica, energía y petroquímica: medición, control de operación y cumplimiento ante entidades.",
    icon: Factory,
  },
  {
    name: "Comercio y distribución",
    description:
      "Cotizar, despachar, cobrar y atender clientes sin depender de que alguien esté disponible.",
    icon: Store,
  },
  {
    name: "Salud y bienestar",
    description:
      "Consultorios, clínicas y centros: agenda, recordatorios, historia y atención al paciente.",
    icon: HeartPulse,
  },
  {
    name: "Educación y formación",
    description:
      "Academias e institutos: inscripción, atención a interesados y seguimiento a estudiantes.",
    icon: GraduationCap,
  },
  {
    name: "Transporte y logística",
    description:
      "Flotas y operadores: control de viajes, documentación y requisitos ante autoridades.",
    icon: Truck,
  },
  {
    name: "Construcción e inmobiliario",
    description:
      "Seguimiento de obra, gestión documental y atención a clientes interesados.",
    icon: Building2,
  },
  {
    name: "Sector público y regulado",
    description:
      "Entidades y contratistas: trazabilidad, reportes y control documental verificable.",
    icon: Landmark,
  },
];

export interface StarterPackage {
  name: string;
  duration: string;
  description: string;
  /** Servicio del portafolio con el que se relaciona el paquete */
  relatedSlug: string;
  featured?: boolean;
}

export const PACKAGES: StarterPackage[] = [
  {
    name: "Diagnóstico Voltac",
    duration: "2 a 4 semanas",
    description:
      "El punto de partida sin riesgo. Revisamos cómo trabaja hoy, dónde se está perdiendo tiempo y entregamos un plan ordenado. Lo que invierta en el diagnóstico se le abona por completo si decide continuar.",
    relatedSlug: "diagnostico-consultoria-formacion",
  },
  {
    name: "Asistente de Atención 24/7",
    duration: "3 a 4 semanas",
    description:
      "Su asistente respondiendo por WhatsApp, cotizando y agendando desde el primer mes. Es el servicio que arranca más rápido y el que primero se paga solo.",
    relatedSlug: "atencion-automatica-clientes",
    featured: true,
  },
  {
    name: "Arranque Digital",
    duration: "6 a 8 semanas",
    description:
      "Para quien necesita existir y vender en digital: página web que genera solicitudes, atención automática y acompañamiento inicial, en un solo paquete.",
    relatedSlug: "presencia-digital-y-clientes",
  },
  {
    name: "Operación Ordenada",
    duration: "8 a 12 semanas",
    description:
      "Para organizaciones con volumen: automatización de los procesos críticos, tablero de control y conexión con los programas que ya usan.",
    relatedSlug: "automatizacion-trabajo-repetitivo",
  },
];

/**
 * Rangos de inversión del formulario de contacto.
 *
 * En pesos colombianos: la conversación comercial ocurre en pesos y pedirle al
 * cliente que traduzca su presupuesto a dólares le añade un cálculo mental antes
 * de contestar una pregunta que ya le incomoda.
 *
 * El `value` es lo que se guarda en `quotes.budget` y viaja al asistente de
 * WhatsApp; el `label` es solo presentación. Se separan porque el valor
 * almacenado es lo que permite filtrar y reportar por tramo, y no debería
 * cambiar cada vez que se reescriba el texto de la opción.
 *
 * Los tramos no son parejos a propósito: por debajo de tres millones el alcance
 * posible es muy distinto, y por encima de diez la cifra deja de ser un rango y
 * pasa a ser una conversación.
 */
export interface BudgetRange {
  value: string;
  label: string;
}

export const BUDGET_RANGES: BudgetRange[] = [
  { value: "1-3M", label: "$1 a $3 millones COP" },
  { value: "3-6M", label: "$3 a $6 millones COP" },
  { value: "6-10M", label: "$6 a $10 millones COP" },
  { value: "10M+", label: "Más de $10 millones COP" },
  { value: "por-definir", label: "Todavía no lo tengo definido" },
];

/**
 * Texto legible de un presupuesto guardado.
 *
 * Devuelve el valor crudo cuando no lo reconoce, que es lo que pasa con los
 * leads anteriores al cambio a pesos (`1k-5k`, `50k+`…). Traducirlos sería
 * mentir sobre lo que esa persona marcó: eligió un rango en dólares y el
 * histórico debe seguir diciendo eso.
 */
export function budgetLabel(value?: string | null): string {
  if (!value) return "";
  return BUDGET_RANGES.find((r) => r.value === value)?.label ?? value;
}

/** "De la conversación al resultado" */
export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Conversación de diagnóstico",
    description:
      "30 minutos, sin costo y sin compromiso. Escuchamos cómo funciona hoy y decimos con franqueza si hay algo que valga la pena resolver.",
  },
  {
    number: "02",
    title: "Propuesta con alcance y precio claro",
    description:
      "Un documento con lo que se entrega, en cuánto tiempo y cuánto cuesta. Sin letra menuda ni proyectos que no terminan.",
  },
  {
    number: "03",
    title: "Implementación por entregas",
    description:
      "Cada dos semanas usted recibe algo que puede probar. Nadie espera meses para saber si la solución sirve.",
  },
  {
    number: "04",
    title: "Medición y entrega final",
    description:
      "Medimos lo que se ganó, dejamos todo documentado y capacitamos al equipo para que funcione sin depender de nosotros.",
  },
];

/** Glosario rápido: traduce el vocabulario técnico al del cliente. */
export const GLOSSARY = [
  {
    term: "Automatización",
    definition:
      "Hacer que una tarea repetitiva se ejecute sola, sin que una persona la haga cada vez.",
  },
  {
    term: "Inteligencia artificial (IA)",
    definition: "Programas capaces de leer, redactar, clasificar y responder en lenguaje humano.",
  },
  {
    term: "Agente o asistente de IA",
    definition:
      "Un programa que conversa con el cliente y además ejecuta acciones: agenda, cotiza, consulta.",
  },
  {
    term: "Modelo privado",
    definition:
      "Instalación donde la información del cliente nunca sale de su propia infraestructura. Clave en derecho, salud y finanzas.",
  },
  {
    term: "Integración",
    definition: "Conectar dos programas que hoy no se hablan, para no digitar lo mismo dos veces.",
  },
  {
    term: "Gemelo digital",
    definition:
      "Una réplica en pantalla de una instalación real, que muestra en vivo lo que está pasando en ella.",
  },
  {
    term: "Telemetría / IoT",
    definition: "Equipos que envían mediciones a distancia de forma automática.",
  },
  {
    term: "Tablero (dashboard)",
    definition: "Una sola pantalla con las cifras clave del negocio, siempre actualizada.",
  },
];

/** Datos de contacto usados en CTAs y en los datos estructurados. */
export const CONTACT = {
  legalName: "Voltac Systems S.A.S.",
  nit: "901.734.603",
  email: "sales@voltac.com.co",
  devEmail: "dev@voltac.com.co",
  privacyEmail: "sales@voltac.com.co",
  phone: "+57 305 246 1088",
  phoneHref: "+573052461088",
  site: "https://voltac.com.co",
  cities: "Cartagena, Sincelejo, Barranquilla y Medellín",
  address: "Urbanización Britania, Cartagena de Indias, Bolívar",
  /** Mapa embebido del pie de página (no requiere clave de Google Maps). */
  mapsEmbed:
    "https://maps.google.com/maps?q=Urbanizaci%C3%B3n%20Britania%2C%20Cartagena%20de%20Indias%2C%20Bol%C3%ADvar%2C%20Colombia&z=15&output=embed",
  /** Enlace directo a WhatsApp con el mensaje ya escrito. */
  whatsapp: "https://wa.me/573052461088?text=" + encodeURIComponent("Hola, quisiera agendar la conversación de 30 minutos."),
  mapsLink:
    "https://www.google.com/maps/search/?api=1&query=Urbanizaci%C3%B3n+Britania%2C+Cartagena+de+Indias%2C+Bol%C3%ADvar%2C+Colombia",
};

/**
 * Perfiles sociales. Solo se pintan los que tengan URL: dejar en `null` los que
 * todavía no existan evita enlaces rotos en el pie de página.
 */
export const SOCIAL = {
  linkedin: "https://www.linkedin.com/company/voltac-systems",
  instagram: null as string | null,
  facebook: null as string | null,
  x: "https://x.com/voltacsystems",
};

/** Páginas legales enlazadas desde el pie de página. */
export const LEGAL_LINKS = [
  { label: "Política de Privacidad (Ley 1581 de 2012)", href: "/politica-de-privacidad" },
  { label: "Términos y Condiciones", href: "/terminos-y-condiciones" },
];

/**
 * Preguntas frecuentes.
 *
 * Existen por dos razones a la vez: le ahorran una conversación al visitante y
 * son el formato que los buscadores generativos (ChatGPT, Gemini, Perplexity)
 * citan textualmente cuando alguien pregunta por un proveedor. Se publican
 * como FAQPage en datos estructurados, y por eso el texto visible y el del
 * marcado tienen que ser el mismo: inventar respuestas que no están en la
 * página es motivo de penalización.
 */
export const FAQ = [
  {
    q: "¿Cuánto cuesta automatizar un proceso en mi empresa?",
    a: "Depende de cuántas tareas se automaticen y de qué tan enredado esté el proceso hoy. Por eso empezamos con un diagnóstico de 2 a 4 semanas que le dice qué cuesta cada mejora y cuánto recupera; lo que invierta en él se le abona por completo si decide continuar.",
  },
  {
    q: "¿Cuánto se demora una implementación?",
    a: "Entre 3 y 12 semanas según el servicio. El asistente de atención por WhatsApp arranca en 3 o 4 semanas y es el que primero se paga solo. En todos los casos usted recibe algo que puede probar cada dos semanas: nadie espera meses para saber si la solución sirve.",
  },
  {
    q: "¿Necesito tener conocimientos técnicos para trabajar con ustedes?",
    a: "No. Hablamos de resultados, no de tecnología. Usted nos cuenta qué tarea le está consumiendo tiempo y nosotros proponemos cómo resolverla; el detalle técnico queda de nuestro lado y su equipo recibe capacitación para operar lo que se entregue.",
  },
  {
    q: "¿Mis datos y los de mis clientes están seguros?",
    a: "Sí. Cuando se manejan datos sujetos a reserva profesional —derecho, salud, finanzas— trabajamos con modelos privados de inteligencia artificial alojados en infraestructura propia, de modo que la información nunca sale de su organización.",
  },
  {
    q: "¿Trabajan con empresas fuera de Cartagena?",
    a: "Sí. Estamos en Cartagena y atendemos proyectos en Sincelejo, Barranquilla, Medellín y el resto del país, además de proyectos en Latinoamérica. Las conversaciones y las entregas se hacen de forma remota sin ningún problema.",
  },
  {
    q: "¿Qué pasa si ya tengo un sistema funcionando?",
    a: "Se conecta con lo que ya usa en vez de reemplazarlo. Buena parte de nuestro trabajo es justamente unir programas que hoy no se hablan, para que nadie tenga que digitar la misma información dos veces.",
  },
  {
    q: "¿La primera conversación tiene costo?",
    a: "No. Son 30 minutos sin costo y sin compromiso. Escuchamos cómo funciona su operación hoy y le decimos con franqueza si hay algo que valga la pena resolver; si no lo hay, se lo decimos.",
  },
];

/** Fecha de última revisión de los documentos legales. */
export const LEGAL_UPDATED = "3 de agosto de 2026";
