import {
  Gauge,
  SlidersHorizontal,
  MonitorCog,
  Activity,
  Zap,
  Waves,
  HardHat,
  Factory,
  FlaskConical,
  Droplets,
  Ship,
  Container,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/**
 * Fuente única de verdad del portafolio de Voltac Industrial.
 *
 * Todo el sitio público —portada, /servicios, /cotizar, pie de página y datos
 * estructurados— lee de aquí: si cambia el portafolio se edita este archivo y
 * no las pantallas.
 *
 * Sobre el tono: quien lee esto es un jefe de mantenimiento o un gerente de
 * planta, no un instrumentista. Tiene que reconocer su propio problema —el lazo
 * que oscila, la parada que se alargó, el medidor que nadie certifica— antes de
 * encontrarse con una sigla. El detalle técnico existe, pero va aparte, en
 * `technical`, como respaldo para quien sí quiere verlo.
 *
 * Sobre las fotos: a diferencia de Voltac Systems, que ilustra con escenas
 * animadas, aquí se muestran equipos reales: un transmisor, un gabinete de
 * control, una subestación. En este oficio la foto es prueba de que uno sabe de
 * qué habla; una abstracción no lo es.
 */

export interface Service {
  /** Numeración comercial del portafolio: 01 … 07 */
  number: string;
  /** Ancla estable para enlaces profundos y futuras páginas por servicio */
  slug: string;
  title: string;
  /** Título corto para menús, selects y tarjetas compactas */
  shortTitle: string;
  /** Frase de apertura del servicio */
  quote: string;
  description: string;
  /** "Así se ve en la práctica" — en lenguaje del cliente */
  practice: string[];
  /** Detalle técnico. Se muestra como información de respaldo. */
  technical: string;
  icon: LucideIcon;
  /** Fotografía del servicio, en `public/servicios/`. */
  image: string;
  /** Texto alternativo: describe el equipo, no el servicio. */
  imageAlt: string;
}

export const SERVICES: Service[] = [
  {
    number: "01",
    slug: "instrumentacion-y-calibracion",
    title: "Instrumentación y calibración",
    shortTitle: "Instrumentación",
    quote: "Una planta no se controla mejor de lo que se mide.",
    description:
      "Si el medidor miente, todo lo que viene después está mal: el control corrige lo que no es, el informe de producción no cuadra y la discusión con el cliente o con el auditor se pierde por falta de respaldo. Suministramos, instalamos y calibramos los instrumentos de su proceso —presión, temperatura, caudal, nivel, analíticos— y le entregamos el certificado con la trazabilidad que le van a pedir.",
    practice: [
      "Instrumentos seleccionados para su proceso, no los que había en bodega",
      "Montaje, cableado y puesta en marcha en sitio",
      "Calibración con patrones trazables y certificado por instrumento",
      "Un plan de recalibración con fechas, para que nada se venza sin aviso",
      "Diagnóstico de los lazos que vienen dando lecturas dudosas",
    ],
    technical:
      "Transmisores de presión, temperatura, caudal másico y volumétrico, nivel por radar, ultrasonido e hidrostático; elementos finales de control y posicionadores; calibración con patrones trazables con certificado de incertidumbre; configuración HART y verificación de lazo punto a punto; documentación de hojas de datos, índice de instrumentos y planos P&ID actualizados.",
    icon: Gauge,
    image: "/servicios/instrumentacion.webp",
    imageAlt: "Transmisor de presión industrial instalado en línea de proceso",
  },
  {
    number: "02",
    slug: "control-automatico-de-procesos",
    title: "Control automático de procesos",
    shortTitle: "Control de procesos",
    quote: "Un lazo mal sintonizado se paga todos los días, en producto y en energía.",
    description:
      "Cuando el control no está afinado, la planta oscila: la temperatura sube y baja, la válvula trabaja de más, el operador termina pasando el lazo a manual y corrigiendo a ojo. Revisamos cómo se comporta su proceso, sintonizamos los lazos y programamos la lógica para que la planta se sostenga sola en el punto en que debe estar.",
    practice: [
      "Los lazos que hoy se operan en manual, devueltos a automático",
      "Menos oscilación, menos desgaste de válvulas y menos consumo",
      "Lógica de arranque, parada y enclavamientos documentada",
      "Alarmas que suenan cuando importa y no todo el tiempo",
      "Su equipo entrenado para operar y ajustar lo que se entregó",
    ],
    technical:
      "Control regulatorio y avanzado sobre PLC y DCS; identificación de la dinámica del proceso y sintonía de lazos PID; cascada, relación, rango partido y control anticipativo; programación en lenguajes IEC 61131-3; enclavamientos y secuencias de arranque y parada; racionalización de alarmas y simulación previa a la puesta en marcha.",
    icon: SlidersHorizontal,
    image: "/servicios/control-procesos.webp",
    imageAlt: "Controlador lógico programable y módulos de entrada y salida en gabinete",
  },
  {
    number: "03",
    slug: "automatizacion-y-supervision",
    title: "Automatización integrada y supervisión",
    shortTitle: "Automatización y SCADA",
    quote: "Lo que no se ve en una pantalla, se descubre cuando ya es tarde.",
    description:
      "La información de la planta suele estar repartida: un dato en el tablero, otro en una planilla, otro en la cabeza del operador del turno anterior. Integramos los equipos que ya tiene en un sistema de supervisión, para que usted vea en una sola pantalla qué está pasando ahora y tenga el histórico cuando haya que explicar qué pasó.",
    practice: [
      "Una pantalla con el estado real de la planta, en vivo",
      "Histórico consultable para sustentar un reclamo o una auditoría",
      "Informes de producción y consumo que se generan solos",
      "Avisos al celular cuando una variable se sale de rango",
      "Equipos de distintas marcas hablando entre sí, sin cambiarlos",
    ],
    technical:
      "Arquitecturas SCADA y HMI; historización de variables y generación automática de informes; integración de equipos por Modbus RTU y TCP, Profibus, Profinet, Ethernet/IP, OPC UA y HART; pasarelas para equipos legados; telemetría de estaciones remotas; conexión con sistemas de gestión para trazabilidad de producción.",
    icon: MonitorCog,
    image: "/servicios/scada.webp",
    imageAlt: "Operador frente a un muro de pantallas de supervisión de proceso",
  },
  {
    number: "04",
    slug: "mantenimiento-predictivo",
    title: "Mantenimiento predictivo y confiabilidad",
    shortTitle: "Mantenimiento predictivo",
    quote: "La falla avisa. Casi siempre, meses antes.",
    description:
      "Un rodamiento que empieza a fallar cambia su vibración; una conexión floja se calienta; un motor desalineado consume de más. Todo eso se puede medir antes de que el equipo se detenga. Montamos un programa de inspecciones con termografía y análisis de vibraciones para que usted decida cuándo intervenir, en vez de enterarse un domingo a las tres de la mañana.",
    practice: [
      "Inspecciones programadas con informe de qué está empezando a fallar",
      "Prioridad clara: qué atender ya y qué puede esperar al próximo paro",
      "Menos paradas imprevistas y menos horas extra de emergencia",
      "Respaldo técnico para justificar un cambio de equipo ante gerencia",
      "Historial por equipo, para ver si el problema se repite",
    ],
    technical:
      "Termografía infrarroja con informe por severidad; análisis de vibraciones en máquina rotativa con diagnóstico de desbalanceo, desalineación, holgura y daño en rodamientos; alineación láser; análisis de causa raíz; definición de planes de mantenimiento por criticidad y construcción de indicadores de disponibilidad y tiempo medio entre fallas.",
    icon: Activity,
    image: "/servicios/termografia.webp",
    imageAlt: "Técnico inspeccionando las conexiones de un tablero de control",
  },
  {
    number: "05",
    slug: "mantenimiento-electrico-y-tableros",
    title: "Mantenimiento eléctrico y tableros de control",
    shortTitle: "Mantenimiento eléctrico",
    quote: "El tablero es donde primero se nota el descuido, y donde más caro se paga.",
    description:
      "Tableros sin marcar, planos que no corresponden, un borne flojo que lleva meses calentando. Cuando algo falla ahí, nadie sabe qué alimenta qué y la parada se alarga horas. Hacemos mantenimiento de sus subestaciones, tableros y motores, dejamos todo identificado y le entregamos los planos actualizados de lo que realmente hay instalado.",
    practice: [
      "Tableros limpios, apretados, identificados y con su plano al día",
      "Revisión de protecciones para que actúen cuando deben",
      "Diseño y construcción de tableros nuevos cuando hace falta",
      "Mantenimiento de motores y arrancadores antes de que se quemen",
      "Informe con lo encontrado y lo que conviene corregir",
    ],
    technical:
      "Mantenimiento preventivo y correctivo de redes eléctricas en baja y media tensión; subestaciones, celdas y transformadores; pruebas de aislamiento, resistencia de contactos y puesta a tierra; coordinación y ajuste de protecciones; diseño y montaje de tableros de fuerza y control; variadores de velocidad y arrancadores suaves; levantamiento de planos unifilares y de control conforme a obra.",
    icon: Zap,
    image: "/servicios/tablero-electrico.webp",
    imageAlt: "Tablero eléctrico industrial con interruptores y cableado ordenado",
  },
  {
    number: "06",
    slug: "calidad-de-energia",
    title: "Estudios de calidad de la energía",
    shortTitle: "Calidad de energía",
    quote: "Si los equipos se dañan sin explicación, la explicación suele estar en la red.",
    description:
      "Variadores que se disparan sin motivo, tarjetas que se queman, un factor de potencia que le está costando una penalización en la factura. Casi siempre hay una causa medible detrás. Instalamos equipos de medición durante varios días, analizamos lo que pasa en su red y le decimos qué corregir y cuánto se recupera al corregirlo.",
    practice: [
      "Medición real durante varios días, no una foto de un momento",
      "Explicación de por qué se están dañando esos equipos",
      "Cálculo de lo que está pagando de más en la factura",
      "Propuesta de corrección con su retorno estimado",
      "Verificación posterior de que el problema quedó resuelto",
    ],
    technical:
      "Registro de calidad de energía conforme a IEC 61000-4-30; análisis de armónicos, huecos de tensión, transitorios, desbalance y parpadeo; evaluación de factor de potencia y dimensionamiento de bancos de condensadores con filtros desintonizados; estudio de cargabilidad y termografía de acometidas; informe con acciones correctivas y estimación de ahorro.",
    icon: Waves,
    image: "/servicios/calidad-energia.webp",
    imageAlt: "Subestación eléctrica con transformador de potencia",
  },
  {
    number: "07",
    slug: "paradas-y-montajes",
    title: "Paradas de planta y montajes electromecánicos",
    shortTitle: "Paradas y montajes",
    quote: "En una parada, la diferencia entre ganar y perder dinero son las horas.",
    description:
      "Una parada programada tiene fecha de inicio y fecha de arranque, y todo lo que se corra cuesta producción. Planificamos y ejecutamos el trabajo de instrumentación, eléctrico y de control de su parada, con cronograma, personal y materiales definidos antes de empezar, para que la planta vuelva a producir el día que se dijo.",
    practice: [
      "Alcance y cronograma acordados antes de bajar la planta",
      "Un responsable en sitio durante toda la parada",
      "Avance reportado a diario, sin sorpresas al final",
      "Pruebas y puesta en marcha acompañadas hasta que produzca estable",
      "Entrega documentada de todo lo que se intervino",
    ],
    technical:
      "Planeación y ejecución de paradas mayores y menores; montaje electromecánico y de instrumentación; tendido de bandejas, canalizaciones y cableado de fuerza, control y señal; pruebas de lazo, precomisionamiento y comisionamiento; puesta en marcha asistida; personal técnico certificado para trabajo en alturas, espacios confinados y trabajo en caliente.",
    icon: HardHat,
    image: "/servicios/montaje.webp",
    imageAlt: "Técnico con arnés y casco trabajando en equipo de altura",
  },
];

/** Cuatro compromisos de la línea industrial. */
export const PILLARS = [
  {
    title: "Se mide antes y después",
    description: "Cada intervención entrega la cifra de lo que cambió.",
  },
  {
    title: "La planta no se detiene",
    description: "Trabajamos con su ventana de producción, no contra ella.",
  },
  {
    title: "Todo queda documentado",
    description: "Planos conforme a obra, certificados e informe de cierre.",
  },
  {
    title: "Personal propio y certificado",
    description: "Competencias vigentes para trabajo de alto riesgo.",
  },
];

export interface Sector {
  name: string;
  description: string;
  icon: LucideIcon;
}

export const SECTORS: Sector[] = [
  {
    name: "Petroquímica y refinación",
    description:
      "Lazos de control, instrumentación en área clasificada y paradas con ventanas estrictas.",
    icon: FlaskConical,
  },
  {
    name: "Alimentos y bebidas",
    description:
      "Medición sanitaria, trazabilidad de proceso y registros que sostienen una auditoría.",
    icon: Wheat,
  },
  {
    name: "Manufactura y plásticos",
    description:
      "Control de temperatura, mantenimiento de máquina rotativa y disponibilidad de línea.",
    icon: Factory,
  },
  {
    name: "Agua y saneamiento",
    description:
      "Telemetría de estaciones remotas, medición de caudal y nivel, y automatización de bombeo.",
    icon: Droplets,
  },
  {
    name: "Portuario y logística",
    description:
      "Mantenimiento eléctrico de equipos de patio, tableros de fuerza y calidad de energía.",
    icon: Ship,
  },
  {
    name: "Cementos y materiales",
    description:
      "Instrumentación en ambiente severo, termografía y confiabilidad de molienda.",
    icon: Container,
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
    name: "Diagnóstico de planta",
    duration: "1 a 2 semanas",
    description:
      "El punto de partida sin riesgo. Recorremos su planta, revisamos instrumentación, tableros y lazos de control, y entregamos un informe con lo que está fallando y en qué orden conviene atenderlo. Lo que invierta se le abona si decide continuar.",
    relatedSlug: "mantenimiento-predictivo",
  },
  {
    name: "Ruta predictiva trimestral",
    duration: "Servicio continuo",
    description:
      "Termografía y análisis de vibraciones en los equipos críticos, cada tres meses, con informe de severidad y recomendación. Es el servicio que primero se paga solo: una parada imprevista evitada suele cubrirlo entero.",
    relatedSlug: "mantenimiento-predictivo",
    featured: true,
  },
  {
    name: "Puesta a punto de lazos",
    duration: "2 a 4 semanas",
    description:
      "Para plantas que operan en manual lo que debería estar en automático. Revisión, calibración y sintonía de los lazos críticos, con medición de la mejora antes y después.",
    relatedSlug: "control-automatico-de-procesos",
  },
  {
    name: "Plan de calibración anual",
    duration: "Servicio continuo",
    description:
      "Para quien tiene que responder ante una auditoría. Inventario de instrumentos, calendario de recalibración y certificados trazables al día, sin que nadie tenga que acordarse de las fechas.",
    relatedSlug: "instrumentacion-y-calibracion",
  },
];

/**
 * Rangos de inversión del formulario de contacto.
 *
 * En pesos colombianos y con tramos más altos que los de la línea de software:
 * un servicio de campo con personal, equipos de medición y materiales arranca
 * en otro orden de magnitud.
 */
export interface BudgetRange {
  value: string;
  label: string;
}

export const BUDGET_RANGES: BudgetRange[] = [
  { value: "2-5M", label: "$2 a $5 millones COP" },
  { value: "5-15M", label: "$5 a $15 millones COP" },
  { value: "15-40M", label: "$15 a $40 millones COP" },
  { value: "40M+", label: "Más de $40 millones COP" },
  { value: "por-definir", label: "Todavía no lo tengo definido" },
];

export function budgetLabel(value?: string | null): string {
  if (!value) return "";
  return BUDGET_RANGES.find((r) => r.value === value)?.label ?? value;
}

/** "De la visita al arranque" */
export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Visita técnica a la planta",
    description:
      "Sin costo y sin compromiso. Vamos, miramos el equipo o el proceso del que nos habló y le decimos con franqueza si hay algo que valga la pena intervenir.",
  },
  {
    number: "02",
    title: "Propuesta con alcance y precio cerrado",
    description:
      "Un documento con lo que se hace, con qué personal, en cuánto tiempo y cuánto cuesta. Sin ítems abiertos que aparecen al final.",
  },
  {
    number: "03",
    title: "Ejecución con avance reportado",
    description:
      "Trabajamos dentro de su ventana de producción, con un responsable en sitio y reporte diario. Usted sabe todos los días dónde va el trabajo.",
  },
  {
    number: "04",
    title: "Pruebas, entrega y documentación",
    description:
      "Se prueba con la planta operando, se mide lo que mejoró y se entregan certificados, planos conforme a obra e informe de cierre.",
  },
];

/** Glosario rápido: traduce el vocabulario técnico al del cliente. */
export const GLOSSARY = [
  {
    term: "Instrumentación",
    definition:
      "Los equipos que miden lo que pasa en el proceso: presión, temperatura, caudal, nivel.",
  },
  {
    term: "Lazo de control",
    definition:
      "El conjunto de medir, comparar y corregir que mantiene una variable donde debe estar.",
  },
  {
    term: "Calibración",
    definition: "Comprobar contra un patrón certificado que un instrumento mide lo que dice medir.",
  },
  {
    term: "PLC",
    definition: "El computador industrial que ejecuta la lógica de la máquina o del proceso.",
  },
  {
    term: "SCADA",
    definition: "El sistema que muestra en pantalla lo que ocurre en la planta y guarda el histórico.",
  },
  {
    term: "Termografía",
    definition: "Fotografía de temperatura que revela conexiones calientes antes de que fallen.",
  },
  {
    term: "Análisis de vibraciones",
    definition: "Medición que detecta desgaste en una máquina rotativa meses antes de la falla.",
  },
  {
    term: "Calidad de la energía",
    definition: "Qué tan limpia y estable llega la electricidad. Cuando es mala, daña equipos.",
  },
  {
    term: "Parada de planta",
    definition:
      "Ventana programada en la que se detiene producción para intervenir lo que no se puede en marcha.",
  },
];

/** Datos de contacto usados en CTAs y en los datos estructurados. */
export const CONTACT = {
  legalName: "Voltac Systems S.A.S.",
  nit: "901.734.603",
  /* sales@ y no una direccion propia de la linea: es el buzon que se sabe que
     existe. Publicar industry@voltac.com.co antes de crearlo significa que los
     correos del formulario y los de la politica de privacidad rebotan, y de
     eso nadie se entera hasta que se pierde un cliente. Se cambia el dia que
     el buzon este creado. */
  email: "sales@voltac.com.co",
  devEmail: "dev@voltac.com.co",
  privacyEmail: "sales@voltac.com.co",
  phone: "+57 305 246 1088",
  phoneHref: "+573052461088",
  site: "https://industry.voltac.com.co",
  cities: "Cartagena, Barranquilla, Santa Marta y el resto del país",
  address: "Urbanización Britania, Cartagena de Indias, Bolívar",
  /** Mapa embebido del pie de página (no requiere clave de Google Maps). */
  mapsEmbed:
    "https://maps.google.com/maps?q=Urbanizaci%C3%B3n%20Britania%2C%20Cartagena%20de%20Indias%2C%20Bol%C3%ADvar%2C%20Colombia&z=15&output=embed",
  /** Enlace directo a WhatsApp con el mensaje ya escrito. */
  whatsapp:
    "https://wa.me/573052461088?text=" +
    encodeURIComponent("Hola, quisiera agendar una visita técnica a mi planta."),
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
  x: null as string | null,
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
 * son el formato que los buscadores generativos citan textualmente cuando
 * alguien pregunta por un proveedor. Se publican como FAQPage en datos
 * estructurados, y por eso el texto visible y el del marcado tienen que ser el
 * mismo: inventar respuestas que no están en la página es motivo de
 * penalización.
 */
export const FAQ = [
  {
    q: "¿Cuánto cuesta un mantenimiento predictivo para mi planta?",
    a: "Depende de cuántos equipos críticos tenga y de la frecuencia de inspección. Por eso empezamos con un diagnóstico de 1 a 2 semanas que recorre la planta y le dice qué equipos conviene incluir y qué cuesta la ruta; lo que invierta en él se le abona si decide continuar.",
  },
  {
    q: "¿Pueden trabajar sin parar la producción?",
    a: "Buena parte del trabajo sí: termografía, análisis de vibraciones, calibración de instrumentos en línea y estudios de calidad de energía se hacen con la planta operando. Lo que exige parada se planifica dentro de la ventana que usted defina, con cronograma acordado antes de bajar el equipo.",
  },
  {
    q: "¿Los certificados de calibración sirven para una auditoría?",
    a: "Sí. Calibramos con patrones trazables y entregamos certificado por instrumento con su incertidumbre asociada, que es lo que un auditor le va a pedir. También dejamos el calendario de recalibración para que ninguno se venza sin aviso.",
  },
  {
    q: "¿Trabajan con equipos de cualquier marca?",
    a: "Sí. Integramos equipos de distintos fabricantes por sus protocolos estándar y, cuando hay equipo antiguo que no se comunica, se resuelve con una pasarela. Cambiar de marca rara vez es necesario y casi nunca es la opción más barata.",
  },
  {
    q: "¿Atienden fuera de Cartagena?",
    a: "Sí. Operamos desde Cartagena y atendemos plantas en Barranquilla, Santa Marta, el eje industrial del Caribe y el resto del país. Para trabajos programados el desplazamiento se incluye en la propuesta desde el principio.",
  },
  {
    q: "¿Su personal está certificado para trabajo de alto riesgo?",
    a: "Sí. El equipo cuenta con competencias vigentes para trabajo en alturas, espacios confinados y trabajo en caliente, y cumplimos el procedimiento de permisos de su planta. Presentamos la documentación del personal antes de ingresar.",
  },
  {
    q: "¿La visita técnica tiene costo?",
    a: "No. La primera visita es sin costo y sin compromiso. Vamos a su planta, miramos el equipo o el proceso del que nos habló y le decimos con franqueza si hay algo que valga la pena intervenir; si no lo hay, se lo decimos.",
  },
];

/** Fecha de última revisión de los documentos legales. */
export const LEGAL_UPDATED = "22 de septiembre de 2026";
