# Backlog — Voltac Systems

Estado a 13 de agosto de 2026. Panel de administración de la suite de Systems.

Documento hermano: `Backlog_Energy.md`.

---

## Core y propio

Los ítems se dividen en dos clases y conviene no confundirlas:

**CORE** — funcionalidad compartida por las dos suites. Se construye **una vez**
en `packages/core` o en el asistente, y se **configura** por suite: cada línea
tiene sus categorías, sus plantillas, sus cuentas y sus datos, pero el código es
el mismo. Aparecen en los dos backlogs con el mismo identificador, y cada
archivo dice qué cambia en su suite.

**SYS** — propio de Systems. No tiene equivalente en Energy o su equivalente es
otro módulo distinto.

> Si modifica un ítem CORE, hágalo en los dos archivos. Ese es el precio de
> tenerlos duplicados, y es deliberado: vale más que cada suite tenga su lista
> completa a que haya que abrir dos documentos para saber qué falta.

**Systems atiende clientes reales ahora mismo.** Eso cambia el criterio frente a
Energy: aquí la estabilidad pesa más que la velocidad, y cualquier cambio se
prueba antes de soltarlo.

---

## Cómo leer las etiquetas

**Importancia** — qué pasa si no se hace.

| | |
|---|---|
| 🔴 Crítica | Bloquea la operación, pierde datos o expone información |
| 🟠 Alta | Cuesta ventas o dinero cada semana que pasa |
| 🟡 Media | Mejora real, pero se puede operar sin ella |
| ⚪ Baja | Comodidad |

**Prioridad** — cuándo. **P0** antes de seguir · **P1** esta semana · **P2**
este mes · **P3** backlog.

**Dificultad** — esfuerzo. **S** horas · **M** uno o dos días · **L** una
semana · **XL** varias semanas, es un producto dentro del producto.

---

## Índice

| # | Ítem | Clase | Imp. | Pri. | Dif. |
|---|---|---|---|---|---|
| **Correcciones** ||||||
| CORE-C1 | Los mensajes escritos desde el celular no llegan al panel | CORE | 🔴 | P0 | S |
| CORE-C2 | El panel muestra como enviados mensajes que no se entregaron | CORE | 🟠 | P1 | M |
| CORE-C3 | El preflight da un falso "Google sin conectar" | CORE | ⚪ | P2 | S |
| SYS-C1 | El campo "Tipo" ofrece las categorías de Energy | SYS | 🟡 | P1 | S |
| **Cambios pendientes** ||||||
| CORE-CP1 | Módulo Cronograma, con calendario propio | CORE | 🟠 | P2 | L |
| CORE-CP2 | Propuesta comercial para prospectos prioritarios | CORE | 🟠 | P2 | M |
| CORE-CP3 | Puntaje del prospecto visible en el CRM | CORE | 🟠 | P1 | M |
| CORE-CP4 | Lectura de PDF con modelo especializado | CORE | 🟡 | P2 | M |
| CORE-CP5 | Entorno de pruebas aislado | CORE | 🟠 | P2 | L |
| SYS-CP1 | Verificar el alias de correo corporativo en Gmail | SYS | 🟡 | P1 | S |
| SYS-CP2 | Definir las categorías de proyecto de Systems | SYS | 🟡 | P1 | S |
| **Funcionalidades nuevas** ||||||
| CORE-F1 | Migrar de Baileys a la API oficial de WhatsApp | CORE | 🔴 | P1 | L |
| CORE-F2 | Aviso por correo cuando entra un prospecto | CORE | 🟠 | P1 | S |
| CORE-F3 | Registrar en el CRM los prospectos que llegan por WhatsApp | CORE | 🟠 | P1 | M |
| CORE-F4 | Motor de calificación del prospecto, 1 a 100 | CORE | 🟠 | P2 | L |
| CORE-F5 | Fecha de seguimiento y mensaje programado automático | CORE | 🟠 | P2 | M |
| CORE-F6 | Diagnóstico guiado antes de la reunión | CORE | 🟡 | P2 | M |
| CORE-F7 | Trazabilidad de clientes recurrentes y recompra | CORE | 🟡 | P3 | M |
| CORE-F8 | Asistente de reuniones y generación de propuestas | CORE | 🟠 | P3 | XL |
| CORE-F9 | Máquina de contenido | CORE | 🟡 | P3 | XL |
| CORE-F10 | Reinventar Analytics hacia redes sociales | CORE | 🟡 | P3 | L |
| **Sugerencias** ||||||
| CORE-S1 | Compartir los componentes duplicados entre las dos suites | CORE | 🟠 | P2 | M |
| CORE-S2 | Vigilancia: enterarse de que un asistente se cayó | CORE | 🟠 | P1 | M |
| CORE-S3 | Caché de prompt para bajar el costo del modelo | CORE | 🟡 | P2 | S |
| CORE-S4 | El informe de gasto, dentro del panel | CORE | ⚪ | P3 | S |

---

# Correcciones

## CORE-C1 · Los mensajes escritos desde el celular no llegan al panel

**CORE · 🔴 Crítica · P0 · S**

Cuando una persona toma la conversación a mano desde el teléfono, esos mensajes
no aparecen en el panel. Pasó en el chat con Daniel Millán. Queda un hueco en la
trazabilidad justo en los momentos más importantes: aquellos en los que alguien
intervino.

**Causa localizada.** En `src/channels/whatsapp-web.ts:293` del repositorio del
asistente:

```ts
if (msg.key?.fromMe) {
  logger.debug({ jid }, 'Descartado: mensaje propio (fromMe)');
```

El filtro existe por una razón buena —sin él el asistente se respondería a sí
mismo en bucle— pero es demasiado ancho: descarta el mensaje **antes de
guardarlo**, no solo antes de contestarlo.

**Qué hacer:** separar las dos decisiones. Un `fromMe` se guarda siempre en el
historial, como turno del asistente marcado como escrito por una persona, y
nunca dispara un turno del modelo. El tipo `ConversationTurn` ya tiene el campo
para distinguir quién escribió de verdad.

**Cuidado:** hay que seguir descartando los que envía el propio asistente, o se
guardarían dos veces. Se distinguen por el `messageId` que él ya conoce.

**En Systems:** aquí duele más que en Energy, porque es la línea con clientes
reales y es donde usted interviene a mano con más frecuencia.

---

## CORE-C2 · El panel muestra como enviados mensajes que no se entregaron

**CORE · 🟠 Alta · P1 · M**

Si falla el envío por WhatsApp, el mensaje ya quedó guardado y el panel lo pinta
igual que cualquier otro. Quien atiende cree que el cliente leyó algo que nunca
recibió.

**Ya resuelto a medias.** El asistente reintenta una vez, y si aun así falla
deja constancia en la conversación para que el modelo no lo dé por leído. Falta
el lado visual: **el panel tiene que marcar esos mensajes**.

**Qué hacer:** llevar el estado de entrega en el turno (`entregado`, `fallido`)
y pintarlo distinto en la pestaña de Conversaciones.

**Configurable por suite:** nada. Es idéntico en las dos.

---

## CORE-C3 · El preflight da un falso "Google sin conectar"

**CORE · ⚪ Baja · P2 · S**

`npm run preflight` recorre los dos clientes pero solo mira la carpeta de
credenciales del perfil con el que arrancó. Sin `PERFIL=energy` dice que Energy
no tiene Google; con él, dice que el que no tiene es Systems.

No rompe nada, pero ya costó tiempo: un aviso que no es cierto entrena a ignorar
los avisos.

**Qué hacer:** que la comprobación resuelva la carpeta de tokens de cada cliente
en vez de usar la del proceso.

---

## SYS-C1 · El campo "Tipo" ofrece las categorías de Energy

**SYS · 🟡 Media · P1 · S**

Al editar un prospecto en el CRM de Systems, el desplegable "Tipo" muestra
`Residencial / Comercial / Industrial / Media Tensión`. Son categorías de
proyecto fotovoltaico. En una empresa de software no significan nada, y quien
clasifica un lead se queda sin opción correcta.

**Causa localizada.** En
`apps/systems/src/app/admin/leads/LeadDetailModal.tsx:124`.

**Qué hacer:** usar las categorías propias de Systems, que hay que definir
primero (SYS-CP2).

**La causa de fondo está en CORE-S1:** el modal está duplicado en cada app en
vez de compartido, así que las dos suites divergen en silencio. Arreglar solo el
desplegable deja el mecanismo intacto.

---

# Cambios pendientes

## CORE-CP1 · Módulo Cronograma, con calendario propio

**CORE · 🟠 Alta · P2 · L**

Un módulo para planificar actividades y tareas internas —"elaborar la propuesta
comercial del cliente X, plazo hasta el jueves"— con su trazabilidad.

**Va en un calendario de Google aparte del de citas.** El asistente debe
consultar **los dos** antes de crear una cita o una actividad, para no agendar
una reunión encima de una tarea comprometida ni al revés. Mezclarlos ensucia la
pestaña de Calendario, donde hoy solo hay compromisos con clientes.

**Configurable por suite:** el identificador del calendario de actividades, los
tipos de actividad y los plazos por defecto. Cada suite lleva sus datos por
separado.

---

## CORE-CP2 · Propuesta comercial para prospectos prioritarios

**CORE · 🟠 Alta · P2 · M**

Cuando un prospecto queda calificado como prioritario, el asistente le ofrece
una propuesta comercial o cotización formal y le pide lo que hace falta: nombre
completo, cédula o NIT, razón social.

Eso crea una **actividad** en el Cronograma —no una cita— con la tarea de enviar
el documento y **plazo máximo de dos días**, para que el prospecto no se enfríe.

**Solo para prioritarios.** Elaborar estos documentos para quien no va a comprar
gasta el recurso más escaso de la empresa.

**Configurable por suite:** la plantilla del documento y los datos que se piden.
Una propuesta de automatización y una de sistema fotovoltaico no se parecen en
nada salvo en la carátula.

Depende de CORE-CP3 y CORE-CP1.

---

## CORE-CP3 · Puntaje del prospecto visible en el CRM

**CORE · 🟠 Alta · P1 · M**

Hoy no se ve la calificación del prospecto en ninguna parte del CRM.

**Qué hacer:** guardar la calificación en la ficha y mostrarla, con su historial:
qué puntaje tenía al principio y cómo evolucionó. Esto es el mínimo; el motor
completo por etapas es CORE-F4.

**Configurable por suite:** de dónde sale el puntaje inicial. En Energy lo
devuelve el motor de dimensionamiento; **en Systems no hay equivalente todavía**,
así que aquí depende directamente de CORE-F4 para tener algo que mostrar.

---

## CORE-CP4 · Lectura de PDF con modelo especializado

**CORE · 🟡 Media · P2 · M**

Las imágenes ya se leen con `google/gemini-2.5-flash-lite`: seis veces más
barato que el modelo de conversación y mucho más rápido. **Ese mismo modelo
acepta PDF**, así que falta enganchar el camino. Hoy un PDF cae como "archivo
adjunto" sin leer.

El patrón ya está probado tres veces —audio con whisper, imagen con Gemini— y es
siempre el mismo: un modelo especializado extrae, devuelve texto, y el asistente
sigue la conversación con eso.

**Configurable por suite:** qué se espera encontrar en el documento. En Systems,
pliegos de requerimientos, cotizaciones de terceros o documentación de procesos;
en Energy, facturas de energía.

---

## CORE-CP5 · Entorno de pruebas aislado

**CORE · 🟠 Alta · P2 · L**

Hoy se prueba en producción. Ya costó caro: una sesión de WhatsApp robada
mientras Systems atendía clientes reales, y una cita de un cliente destruida.

Hace falta una copia completa —su propio número, sus propias carpetas de datos,
su propio calendario— donde romper cosas no tenga consecuencias.

**En Systems esto pesa más que en ninguna otra parte del backlog.** Es la línea
con clientes reales: cada prueba en producción aquí es una tirada de dados con
la reputación de la empresa.

---

## SYS-CP1 · Verificar el alias de correo corporativo en Gmail

**SYS · 🟡 Media · P1 · S**

El asistente ya envía correos de verdad por Gmail, con el portafolio adjunto.
Pero salen **desde la cuenta de Google conectada** (`contabilidadvoltac@gmail.com`),
no desde `sales@voltac.com.co`.

El `Reply-To` sí apunta a sales, así que las respuestas caen donde deben. Lo que
queda mal es el remitente que ve el prospecto en su primer correo.

**Qué hacer:** verificar `sales@voltac.com.co` como alias en la cuenta conectada
(Configuración → Cuentas → Enviar como) y descomentar `remitente` en el bloque
`conector-correo` de `tenants/voltac/agent.yaml`. Gmail ignora ese encabezado si
el alias no está verificado, así que **el orden importa**: primero el alias,
después la configuración.

---

## SYS-CP2 · Definir las categorías de proyecto de Systems

**SYS · 🟡 Media · P1 · S**

Bloquea a SYS-C1. Hay que decidir cómo se clasifican los prospectos de Systems
—automatización de procesos, desarrollo a medida, integración, soporte, o las
que correspondan— y con eso llenar el desplegable.

**Es una decisión de negocio, no técnica.** Conviene que las categorías sirvan
después para filtrar el CRM y para alimentar la calificación de CORE-F4, así que
vale la pena pensarlas una vez bien.

---

# Funcionalidades nuevas

## CORE-F1 · Migrar de Baileys a la API oficial de WhatsApp

**CORE · 🔴 Crítica · P1 · L**

Baileys es el canal **no oficial**: se conecta como dispositivo vinculado, igual
que WhatsApp Web. WhatsApp no lo autoriza, y usarlo con un número de producción
puede terminar en bloqueo de la cuenta.

Buena parte de los problemas recientes salen de ahí: sesiones de cifrado que se
rompen y dejan mensajes ilegibles en el teléfono del cliente, `Timed Out` que
hacen perder envíos, la sesión que se puede robar entre procesos, el QR que hay
que volver a escanear.

**Lo que cambia:** el primer mensaje a alguien que no ha escrito en 24 horas
exige plantilla aprobada por Meta, lo cual afecta directamente al flujo de
primer contacto con prospectos. Hay costo por conversación. Y hay que verificar
el número y el negocio.

**Lo que se gana:** estabilidad, entrega garantizada, y dejar de operar sobre
algo que puede desaparecer de un día para otro.

El adaptador de la Cloud API ya existe (`src/channels/whatsapp-cloud.ts`), así
que el trabajo es de trámite, plantillas y pruebas más que de arquitectura.

**Configurable por suite:** cada línea tiene su número, su verificación y sus
plantillas aprobadas. Son dos trámites, no uno.

**En Systems:** es la línea con clientes reales, así que un bloqueo de cuenta
aquí es lo peor que puede pasar en todo el backlog. **Empiece el trámite por
Systems.**

---

## CORE-F2 · Aviso por correo cuando entra un prospecto

**CORE · 🟠 Alta · P1 · S**

Hoy un prospecto nuevo aparece en el CRM y nadie se entera hasta que alguien
abre el panel.

**Qué hacer:** un correo al entrar el lead, con lo que dejó en el formulario y
un enlace directo a su ficha. El envío por Gmail ya está resuelto y autorizado
en el asistente; aquí es cuestión de disparar desde el sitio.

**Configurable por suite:** el destinatario y la plantilla.

De los ítems del backlog es de los más baratos y de los que más se notan.

---

## CORE-F3 · Registrar en el CRM los prospectos que llegan por WhatsApp

**CORE · 🟠 Alta · P1 · M**

El CRM solo recoge lo que entra por los formularios. Quien escribe directo al
WhatsApp hay que meterlo a mano, y se pierde.

**Qué hacer:** que el asistente recoja los datos durante la conversación y cree
la ficha solo.

**Con cuidado en la forma.** Los datos se piden porque hacen falta para
continuar —para pasar el caso al área técnica, para mandar la propuesta—, no
anunciando que se van a registrar en un sistema. Es una conversación comercial
normal, no un formulario disfrazado.

**Configurable por suite:** qué datos son imprescindibles. En Systems, empresa y
el proceso que quiere resolver; en Energy, consumo y ubicación.

---

## CORE-F4 · Motor de calificación del prospecto, 1 a 100

**CORE · 🟠 Alta · P2 · L**

Una calificación que se recalcula **en cada etapa** de la conversación,
evaluando lo hablado contra unos ítems definidos, y que ajusta la prioridad del
lead automáticamente.

**La parte difícil no es el código, son los ítems.** Hay que definir qué suma y
cuánto, y esa lista es una decisión de negocio: conviene escribirla antes de
programar nada.

**Recomendación fuerte:** que el puntaje sea **determinista y explicable** —una
suma de factores visibles en el CRM— y no un número que decida el modelo. Un
puntaje que nadie puede auditar no se usa, y si el modelo cambia de humor la
prioridad de un cliente cambia sin motivo.

**Configurable por suite:** los ítems y sus pesos, que son completamente
distintos. En Systems: tamaño de la empresa, cuántas personas dedica hoy al
proceso, si hay presupuesto asignado, urgencia, si quien escribe decide. En
Energy: consumo, si es propietario, plazo, si preguntó por financiación.

Depende de CORE-CP3 para tener dónde mostrarse.

---

## CORE-F5 · Fecha de seguimiento y mensaje programado automático

**CORE · 🟠 Alta · P2 · M**

Al enviar una propuesta comercial, el prospecto recibe una fecha de seguimiento
**tres días hábiles después**, y en esa fecha sale un mensaje de WhatsApp
**dentro del horario laboral**.

**Dos detalles que hay que acertar.** Los días hábiles no son días naturales:
hay que saltar fines de semana y festivos colombianos, que son muchos. Y el
mensaje no debe salir si el prospecto ya respondió mientras tanto — eso importa
más, porque un seguimiento que ignora que la persona contestó se lee como que no
la están escuchando.

**Configurable por suite:** el plazo, el horario y el texto del mensaje.

---

## CORE-F6 · Diagnóstico guiado antes de la reunión

**CORE · 🟡 Media · P2 · M**

Un formulario interactivo que recorre las preguntas clave para decidir si vale
la pena escalar a reunión y para llegar a ella con los requerimientos ya
entendidos.

Sirve para dos cosas: filtra a quien no va a comprar, y evita que la primera
reunión se gaste en preguntas que podían haberse hecho antes.

**Configurable por suite: aquí está casi todo el trabajo.** Las preguntas son el
módulo. **En Systems este formulario es el equivalente a lo que Dimensionamiento
es en Energy**: la pieza que convierte una conversación vaga en un alcance
estimable. Merece el mismo cuidado.

---

## CORE-F7 · Trazabilidad de clientes recurrentes y recompra

**CORE · 🟡 Media · P3 · M**

En el CRM: cuántas veces ha contratado un cliente, cuánto ha gastado en total, y
la tasa de recompra de la empresa.

**Para qué:** dar más prioridad a los mejores clientes. Uno que ya compró dos
veces vale más que un prospecto nuevo, y hoy se tratan igual.

Requiere cruzar el CRM con el módulo de contabilidad, que es donde están las
cotizaciones y las facturas.

**En Systems esto rinde más que en Energy:** el software se recontrata —soporte,
ampliaciones, nuevos procesos— mientras que una instalación fotovoltaica es casi
siempre una sola vez por cliente.

---

## CORE-F8 · Asistente de reuniones y generación de propuestas

**CORE · 🟠 Alta · P3 · XL**

La siguiente etapa de la máquina de ventas: cerrar el ciclo desde que llega el
prospecto hasta que es cliente. Tres piezas encadenadas:

1. Un asistente durante las reuniones —virtuales o presenciales— que transcriba
   y saque los puntos clave y los acuerdos.
2. Estructurar esa información en los campos que necesita una propuesta.
3. Generar la cotización o propuesta comercial con el formato y los lineamientos
   de la empresa.

**Lo importante:** la tercera pieza **ya existe fuera de la plataforma**. Hay una
skill de Claude hecha exclusivamente para esto, con los formatos, la estructura
y los lineamientos definidos y probados. No hay que rediseñar ese criterio, hay
que traerlo dentro: que el sistema arme el prompt de entrada con los datos de la
reunión y produzca el documento igual que hoy.

**Recomendación de orden:** empezar por el final. La generación con datos
metidos a mano da valor mucho antes que la transcripción, y no depende de ella.

**Configurable por suite:** las plantillas y los lineamientos de cada línea.

---

## CORE-F9 · Máquina de contenido

**CORE · 🟡 Media · P3 · XL**

Evolución del módulo Contenido, que hoy solo permite planificar.

**El objetivo:** un sistema que conecte las herramientas de generación —video,
carruseles, imágenes—, busque inspiración, mida qué está funcionando con
métricas de impacto, y **ajuste con eso su propio algoritmo de generación de
ideas**, para que el contenido evolucione en vez de repetirse.

**El reparto de trabajo:** el sistema define qué hace falta de usted —"este
monólogo, en este plano, en este entorno"— y se encarga del resto. Programa el
contenido para aprobación y, una vez aprobado y ajustado, lo sube solo a las
redes conectadas.

Es un producto entero, no un módulo. **Conviene partirlo en tres:** primero
programación y aprobación, después publicación automática, y al final el bucle
de métricas que ajusta las ideas.

**Configurable por suite: mucho.** Cada línea tiene sus cuentas, su voz, sus
pilares de contenido y su público. Systems le habla a gerentes y dueños de
empresa sobre tiempo perdido en tareas manuales; Energy le habla a hogares y
comercios sobre facturas de luz. **El motor es el mismo; el criterio editorial,
no.**

---

## CORE-F10 · Reinventar Analytics hacia redes sociales

**CORE · 🟡 Media · P3 · L**

Los datos que muestra hoy no aportan. Lo que interesa son métricas globales de
redes sociales.

**Qué hacer:** conectar Facebook, Instagram y las demás; indicadores de impacto
por canal; y el estado de las campañas publicitarias activas.

**Está emparentado con CORE-F9:** la parte de métricas de la máquina de
contenido y este módulo son el mismo problema. Conviene diseñarlos juntos aunque
se entreguen por separado, o acabarán siendo dos integraciones distintas contra
las mismas APIs.

**Configurable por suite:** las cuentas conectadas y las campañas de cada línea.

---

# Sugerencias

## CORE-S1 · Compartir los componentes duplicados entre las dos suites

**CORE · 🟠 Alta · P2 · M**

SYS-C1 —Systems mostrando categorías de Energy— no es un descuido aislado: es el
síntoma de que `LeadDetailModal` y compañía están **copiados en cada app** en vez
de vivir en `packages/core`.

Mientras sigan duplicados, cada arreglo hay que hacerlo dos veces, y el día que
se olvide uno las suites divergen sin que nadie lo note. Choca de frente con el
principio de que los paneles son gemelos estructurales.

**Qué hacer:** mover a `packages/core` lo que es igual en las dos, y dejar en
cada app solo lo que de verdad difiere —**parametrizando** las categorías, por
ejemplo, en vez de duplicando el modal—.

Este ítem es, en el fondo, el que hace que todo lo marcado CORE sea posible sin
trabajo doble.

---

## CORE-S2 · Vigilancia: enterarse de que un asistente se cayó

**CORE · 🟠 Alta · P1 · M**

El asistente de Energy estuvo horas en bucle de caída sin que nadie se enterara.
PM2 lo mostraba "online" porque lo relanzaba una y otra vez, y el único síntoma
visible era un "Internal Server Error" genérico en otra pantalla del panel.

**Qué hacer:** que el panel muestre si cada asistente está vivo de verdad —no
solo si el proceso existe— y que una caída sostenida avise por WhatsApp al
número interno, como ya hacen los fallos de herramienta.

Un sistema que se cae en silencio es peor que uno que se cae ruidosamente.

---

## CORE-S3 · Caché de prompt para bajar el costo del modelo

**CORE · 🟡 Media · P2 · S**

Cada llamada al modelo reenvía el prompt completo, unos 6.400 tokens, y eso es
alrededor del 70% del costo de cada llamada. Un mensaje del cliente son varias
llamadas cuando hay herramientas de por medio.

Si el proveedor de Kimi en OpenRouter soporta caché de prefijo, esos tokens
repetidos costarían una fracción. **Hay que medirlo antes de prometerlo**, pero
es la palanca más grande que hay sobre el gasto, más que reducir el uso.

---

## CORE-S4 · El informe de gasto, dentro del panel

**CORE · ⚪ Baja · P3 · S**

Existe `npm run costos`: desglosa el gasto del modelo por día y por
conversación, y marca los turnos que dieron demasiadas vueltas. Hoy solo se ve
por terminal.

Llevarlo al panel lo pone donde alguien lo va a mirar de verdad.

---

# Orden sugerido para Systems

**Systems atiende clientes reales, así que el criterio es distinto al de
Energy: primero no romper, después mejorar.**

**Ahora:** CORE-C1. Cada intervención manual desde el celular que no queda
registrada es trazabilidad perdida, y no se recupera.

**Esta semana:** CORE-F2 (aviso por correo) y SYS-CP1/SYS-CP2, que son de horas.
CORE-S2 detrás, porque hoy no hay forma de saber que la línea se cayó salvo que
un cliente se queje. Y **arrancar el trámite de CORE-F1 empezando por Systems**:
es la línea con clientes reales y los tiempos de verificación de Meta no
dependen de nosotros.

**Este mes:** CORE-CP5 antes que cualquier funcionalidad nueva. Cada cambio que
se prueba en producción aquí se prueba encima de conversaciones con clientes
reales, y eso ya salió mal una vez. Después CORE-CP3 y CORE-F4 juntos —la
calificación no sirve si no se ve, y verla no sirve si no se recalcula—, y
detrás CORE-CP1 y CORE-CP2.

**Después:** CORE-F6, que en Systems es la pieza que falta para convertir una
conversación en un alcance estimable. Luego CORE-F8 empezando por el final,
CORE-F9 partido en tres, y CORE-F10 diseñado junto con las métricas de CORE-F9.
