# Backlog — Voltac Energy

Estado a 13 de agosto de 2026. Panel de administración de la suite de Energy.

Documento hermano: `Backlog_Systems.md`.

---

## Core y propio

Los ítems se dividen en dos clases y conviene no confundirlas:

**CORE** — funcionalidad compartida por las dos suites. Se construye **una vez**
en `packages/core` o en el asistente, y se **configura** por suite: cada línea
tiene sus categorías, sus plantillas, sus cuentas y sus datos, pero el código es
el mismo. Aparecen en los dos backlogs con el mismo identificador, y cada
archivo dice qué cambia en su suite.

**ENE** — propio de Energy. No tiene equivalente en Systems o su equivalente es
otro módulo distinto. Dimensionamiento es el caso claro.

> Si modifica un ítem CORE, hágalo en los dos archivos. Ese es el precio de
> tenerlos duplicados, y es deliberado: vale más que cada suite tenga su lista
> completa a que haya que abrir dos documentos para saber qué falta.

**Energy todavía no atiende clientes reales.** Está a punto de empezar con los
prospectos pendientes. Eso cambia el criterio frente a Systems: aquí se puede
tolerar más riesgo y moverse más rápido, pero **lo que se rompa ahora se rompe
delante del primer cliente de la línea**, y no hay segunda primera impresión.

---

## Cómo leer las etiquetas

**Importancia** — qué pasa si no se hace.

| | |
|---|---|
| 🔴 Crítica | Bloquea la operación, pierde datos o expone información |
| 🟠 Alta | Cuesta ventas o dinero cada semana que pasa |
| 🟡 Media | Mejora real, pero se puede operar sin ella |
| ⚪ Baja | Comodidad |

**Prioridad** — cuándo. **P0** antes de contactar los prospectos pendientes ·
**P1** esta semana · **P2** este mes · **P3** backlog.

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
| **Cambios pendientes** ||||||
| ENE-CP1 | Rotar la clave de API y borrar los recibos de prueba | ENE | 🔴 | P0 | S |
| ENE-CP2 | Guías de lectura del recibo de los demás operadores | ENE | 🟠 | P0 | S |
| ENE-CP3 | Portafolio de Energy en el catálogo del asistente | ENE | 🟡 | P1 | S |
| ENE-CP4 | Precios reales del área técnica en el motor | ENE | 🟠 | P1 | S |
| ENE-CP5 | Margen de sobredimensionamiento configurable | ENE | 🟡 | P2 | S |
| ENE-CP6 | Definir el buzón comercial de Energy | ENE | 🟡 | P1 | S |
| ENE-CP7 | URI de Google a https | ENE | ⚪ | P2 | S |
| CORE-CP1 | Módulo Cronograma, con calendario propio | CORE | 🟠 | P2 | L |
| CORE-CP2 | Propuesta comercial para prospectos prioritarios | CORE | 🟠 | P2 | M |
| CORE-CP3 | Puntaje del prospecto visible en el CRM | CORE | 🟠 | P1 | M |
| CORE-CP4 | Lectura de PDF con modelo especializado | CORE | 🟠 | P1 | M |
| CORE-CP5 | Entorno de pruebas aislado | CORE | 🟠 | P2 | L |
| **Funcionalidades nuevas** ||||||
| CORE-F1 | Migrar de Baileys a la API oficial de WhatsApp | CORE | 🔴 | P1 | L |
| CORE-F2 | Aviso por correo cuando entra un prospecto | CORE | 🟠 | P1 | S |
| CORE-F3 | Registrar en el CRM los prospectos que llegan por WhatsApp | CORE | 🟠 | P1 | M |
| CORE-F4 | Motor de calificación del prospecto, 1 a 100 | CORE | 🟠 | P2 | L |
| CORE-F5 | Fecha de seguimiento y mensaje programado automático | CORE | 🟠 | P2 | M |
| CORE-F6 | Diagnóstico guiado antes de la reunión | CORE | 🟡 | P3 | M |
| CORE-F7 | Trazabilidad de clientes recurrentes y recompra | CORE | ⚪ | P3 | M |
| CORE-F8 | Asistente de reuniones y generación de propuestas | CORE | 🟠 | P3 | XL |
| CORE-F9 | Máquina de contenido | CORE | 🟡 | P3 | XL |
| CORE-F10 | Reinventar Analytics hacia redes sociales | CORE | 🟡 | P3 | L |
| **Sugerencias** ||||||
| CORE-S1 | Compartir los componentes duplicados entre las dos suites | CORE | 🟠 | P2 | M |
| ~~CORE-S5~~ | ~~Panel como aplicación móvil e instalable (PWA)~~ · **hecho** | CORE | 🟠 | — | L |
| CORE-S2 | Vigilancia: enterarse de que un asistente se cayó | CORE | 🟠 | P1 | M |
| CORE-S3 | Caché de prompt para bajar el costo del modelo | CORE | 🟡 | P2 | S |
| CORE-S4 | El informe de gasto, dentro del panel | CORE | ⚪ | P3 | S |

---

# Correcciones

## CORE-C1 · Los mensajes escritos desde el celular no llegan al panel

**CORE · 🔴 Crítica · P0 · S**

Cuando una persona toma la conversación a mano desde el teléfono, esos mensajes
no aparecen en el panel. Queda un hueco en la trazabilidad justo en los momentos
más importantes: aquellos en los que alguien intervino.

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
nunca dispara un turno del modelo.

**En Energy:** va a doler en cuanto empiecen los prospectos. En una venta
consultiva usted va a entrar a mano con frecuencia —a matizar una cifra, a
cerrar una reunión— y hoy nada de eso queda registrado.

---

## CORE-C2 · El panel muestra como enviados mensajes que no se entregaron

**CORE · 🟠 Alta · P1 · M**

Si falla el envío por WhatsApp, el mensaje ya quedó guardado y el panel lo pinta
igual que cualquier otro. Quien atiende cree que el cliente leyó algo que nunca
recibió. **Pasó en Energy**, con una respuesta completa sobre financiación: en el
panel estaba, en el teléfono del cliente no.

**Ya resuelto a medias.** El asistente reintenta una vez, y si aun así falla deja
constancia en la conversación para que el modelo no lo dé por leído. Falta el
lado visual: **el panel tiene que marcar esos mensajes**.

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

# Cambios pendientes

## ENE-CP1 · Rotar la clave de API y borrar los recibos de prueba

**ENE · 🔴 Crítica · P0 · S**

Dos cosas de higiene, las dos con datos que no deberían estar donde están.

**La clave.** `CRM_API_KEY` de Energy quedó visible en pantalla durante la
depuración, así que está en el historial de la conversación de trabajo. Es una
clave interna que solo sirve contra `127.0.0.1:3000`, así que el riesgo práctico
es bajo, pero rompe la regla de que los secretos no pasan por el chat.

```bash
cd /var/www/voltac-systems && VOLTAC_DATA_DIR=/var/www/voltac-data \
  node scripts/crear-clave-api.mjs energy "Asistente WhatsApp"
```

Se copia a `.env.energy` y se reinicia Energy. **Importante:** hacerlo sin que
nadie más lea esa terminal, o se repite el problema.

**Los recibos.** En `.data-energy/voltac-energy/recibos/` hay facturas de prueba
con nombre, dirección, estrato y consumo de una persona real. Se guardan a
propósito —el técnico las necesita para validar el dimensionamiento contra el
papel original— pero las de prueba sobran.

*La clave de Systems no estuvo expuesta; por eso este ítem es solo de Energy.*

---

## ENE-CP2 · Guías de lectura del recibo de los demás operadores

**ENE · 🟠 Alta · P0 · S**

Está la de Afinia. Faltan **Air-e, EPM, Celsia y Enel**, y sobre todo una
`recibo-generica.png` de respaldo.

Sin la genérica, a un cliente de otro operador se le manda la de Afinia, que lo
manda a buscar donde su factura no tiene nada: **peor que no mandarle ninguna**.

Van en `tenants/voltac-energy/assets/guias/` del repositorio del asistente. El
nombre del archivo tiene que contener el nombre del operador, porque así elige
la herramienta cuál mandar.

**Es P0 y no P1** porque los prospectos pendientes no son todos de Afinia, y esta
guía es la salida cuando la foto no se puede leer. Sin ella, ese camino de
respaldo se rompe justo con quien más ayuda necesita.

---

## ENE-CP3 · Portafolio de Energy en el catálogo del asistente

**ENE · 🟡 Media · P1 · S**

Systems tiene su portafolio y lo envía por chat o adjunto en un correo. Energy
no tiene ninguno cargado, así que puede mandar correos pero **sin adjunto**.

Va en `tenants/voltac-energy/assets/`.

---

## ENE-CP4 · Precios reales del área técnica en el motor

**ENE · 🟠 Alta · P1 · S**

El motor de dimensionamiento calcula con **precios de referencia públicos**. Ya
funciona y da cifras coherentes —2,44 kWp, 4 paneles, ~12,2 millones para un
consumo pico de 272 kWh— pero son de referencia, no de Voltac.

Están en `packages/core/src/dimensionamiento/datos.ts`: precio por Wp según
tramo, factores por modalidad y tipo de techo, RETIE, medidor bidireccional,
trámite ante el operador.

**Cambiar esos números ajusta a la vez el módulo del panel y lo que el asistente
le dice al cliente**, que es exactamente lo que tiene que pasar.

**Sube a P1 en cuanto empiecen los prospectos:** cada cifra que salga por
WhatsApp con precios de referencia es una expectativa que alguien tendrá que
corregir en la reunión.

---

## ENE-CP5 · Margen de sobredimensionamiento configurable

**ENE · 🟡 Media · P2 · S**

Hoy hay una diferencia deliberada: el asistente dimensiona con **cubrimiento
1,15** —un 15% por encima del consumo pico— y el módulo del panel con **1,0**.

La razón es buena: el asistente da un estimado preliminar y conviene el margen
por degradación de paneles y crecimiento del consumo; en el panel decide un
técnico con el recibo delante y no hace falta un colchón automático.

**El problema es que está escrito en el código**, en el tool `dimensionar_sistema`
del asistente. Si mañana el criterio cambia a 10% o 20%, hay que tocar código y
desplegar.

**Qué hacer:** llevarlo a la configuración del módulo, visible en el panel, para
que el área técnica lo ajuste sin pedir un despliegue.

---

## ENE-CP6 · Definir el buzón comercial de Energy

**ENE · 🟡 Media · P1 · S**

El asistente de Energy ya envía correos, pero **sin `Reply-To`**, porque Energy
no tiene todavía un buzón comercial documentado. Se dejó fuera a propósito:
poner uno inventado es peor que no poner ninguno, porque el cliente responde y
no lo lee nadie.

Además, los correos salen desde la cuenta de Google conectada
(`contabilidadvoltac@gmail.com`), no desde una dirección de la marca.

**Qué hacer, en este orden:** definir la dirección comercial de Energy,
verificarla como alias en la cuenta conectada (Configuración → Cuentas → Enviar
como), y entonces configurar `remitente` y `replyTo` en el bloque
`conector-correo` de `tenants/voltac-energy/agent.yaml`. Gmail ignora el
remitente si el alias no está verificado, así que el orden importa.

*El equivalente en Systems es SYS-CP1, donde la dirección ya existe
(`sales@voltac.com.co`) y solo falta verificar el alias.*

---

## ENE-CP7 · URI de Google a https

**ENE · ⚪ Baja · P2 · S**

En la consola de Google Cloud, una de las URI autorizadas de Energy está como
`http://energy.voltac.com.co/...`. Debería ser `https://`.

No molesta hoy porque la autorización vigente ya se hizo, pero va a fallar con
`redirect_uri_mismatch` la próxima vez que haya que reautorizar — que suele ser
el peor momento posible.

---

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

**En Energy** los tipos de actividad son distintos: visita técnica, elaboración
de propuesta, trámite ante el operador de red, entrega de RETIE.

---

## CORE-CP2 · Propuesta comercial para prospectos prioritarios

**CORE · 🟠 Alta · P2 · M**

Cuando un prospecto queda calificado como prioritario, el asistente le ofrece
una propuesta comercial o cotización formal y le pide lo que hace falta: nombre
completo, cédula o NIT, razón social.

Eso crea una **actividad** en el Cronograma —no una cita— con la tarea de enviar
el documento y **plazo máximo de dos días**, para que el prospecto no se enfríe.

**Solo para prioritarios.** Elaborar estos documentos para quien no va a comprar
gasta el recurso más escaso de la empresa. En fotovoltaica esto pesa
especialmente: entra mucha consulta legítima que nunca será venta.

**Configurable por suite:** la plantilla del documento y los datos que se piden.

Depende de CORE-CP3 y CORE-CP1.

---

## CORE-CP3 · Puntaje del prospecto visible en el CRM

**CORE · 🟠 Alta · P1 · M**

Hoy no se ve la calificación del prospecto en ninguna parte del CRM.

**En Energy esto es especialmente absurdo**, porque el motor de dimensionamiento
**ya devuelve** una calificación con puntaje, nivel, qué falta por saber y una
recomendación de si conviene ofrecer reunión. Se calcula, se usa dentro de la
conversación para decidir, y **se pierde**. El dato ya existe: solo falta
guardarlo y pintarlo.

**Qué hacer:** guardar la calificación en la ficha y mostrarla, con su historial:
qué puntaje tenía al principio y cómo evolucionó.

**Configurable por suite:** de dónde sale el puntaje inicial. En Energy lo
devuelve el dimensionamiento; en Systems no hay equivalente y depende de
CORE-F4.

---

## CORE-CP4 · Lectura de PDF con modelo especializado

**CORE · 🟠 Alta · P1 · M**

Las imágenes ya se leen con `google/gemini-2.5-flash-lite`: seis veces más
barato que el modelo de conversación y mucho más rápido. **Ese mismo modelo
acepta PDF**, así que falta enganchar el camino. Hoy un PDF cae como "archivo
adjunto" sin leer.

El patrón ya está probado tres veces —audio con whisper, imagen con Gemini— y es
siempre el mismo: un modelo especializado extrae, devuelve texto, y el asistente
sigue la conversación con eso.

**En Energy es P1 y no P2:** muchos clientes descargan la factura en PDF desde el
portal del operador y la reenvían tal cual, sin pasar por la cámara. Hoy ese
camino no funciona, y es el más cómodo para el cliente.

---

## CORE-CP5 · Entorno de pruebas aislado

**CORE · 🟠 Alta · P2 · L**

Hoy se prueba en producción. Ya costó caro: una sesión de WhatsApp robada
mientras Systems atendía clientes reales, y una cita de un cliente destruida.

Hace falta una copia completa —su propio número, sus propias carpetas de datos,
su propio calendario— donde romper cosas no tenga consecuencias.

**En Energy** el riesgo inmediato es menor que en Systems porque todavía no hay
clientes, pero eso cambia esta semana.

---

# Funcionalidades nuevas

## CORE-F1 · Migrar de Baileys a la API oficial de WhatsApp

**CORE · 🔴 Crítica · P1 · L**

Baileys es el canal **no oficial**: se conecta como dispositivo vinculado, igual
que WhatsApp Web. WhatsApp no lo autoriza, y usarlo con un número de producción
puede terminar en bloqueo de la cuenta.

Buena parte de los problemas recientes salen de ahí, y **casi todos le tocaron a
Energy**: sesiones de cifrado rotas que dejaron mensajes ilegibles en el teléfono
del cliente ("Esperando este mensaje"), `Timed Out` que hicieron perder envíos,
la sesión robada entre procesos.

**Lo que cambia:** el primer mensaje a alguien que no ha escrito en 24 horas
exige plantilla aprobada por Meta. **Eso afecta de lleno al plan de Energy**, que
es precisamente contactar en frío a los prospectos pendientes. Hay costo por
conversación y hay que verificar número y negocio.

**Lo que se gana:** estabilidad, entrega garantizada, y dejar de operar sobre
algo que puede desaparecer de un día para otro.

El adaptador de la Cloud API ya existe (`src/channels/whatsapp-cloud.ts`), así
que el trabajo es de trámite, plantillas y pruebas más que de arquitectura.

**Configurable por suite:** cada línea tiene su número, su verificación y sus
plantillas. Son dos trámites, no uno.

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
continuar —para pasar el estudio al área técnica, para mandar la propuesta—, no
anunciando que se van a registrar en un sistema. Es una conversación comercial
normal, no un formulario disfrazado.

**Configurable por suite:** qué datos son imprescindibles. **En Energy el
asistente ya pide de forma natural consumo y ubicación** para poder dimensionar,
así que buena parte del trabajo está hecho: falta que eso cree la ficha en vez
de quedarse en la conversación.

---

## CORE-F4 · Motor de calificación del prospecto, 1 a 100

**CORE · 🟠 Alta · P2 · L**

Una calificación que se recalcula **en cada etapa** de la conversación,
evaluando lo hablado contra unos ítems definidos, y que ajusta la prioridad del
lead automáticamente.

Hoy en Energy existe una calificación, pero solo la del dimensionamiento y solo
en ese momento. Esto es continuo.

**La parte difícil no es el código, son los ítems.** Hay que definir qué suma y
cuánto, y esa lista es una decisión de negocio.

**Recomendación fuerte:** que el puntaje sea **determinista y explicable** —una
suma de factores visibles en el CRM— y no un número que decida el modelo. Un
puntaje que nadie puede auditar no se usa, y si el modelo cambia de humor la
prioridad de un cliente cambia sin motivo.

**Configurable por suite:** los ítems y sus pesos. En Energy: consumo, si es
propietario del inmueble, plazo con el que lo haría, si preguntó por
financiación, si pidió cotización, tipo de cliente. **Varios de esos ya se
recogen** y alimentan la calificación del dimensionamiento, así que aquí se parte
con ventaja.

---

## CORE-F5 · Fecha de seguimiento y mensaje programado automático

**CORE · 🟠 Alta · P2 · M**

Al enviar una propuesta comercial, el prospecto recibe una fecha de seguimiento
**tres días hábiles después**, y en esa fecha sale un mensaje de WhatsApp
**dentro del horario laboral**.

**Dos detalles que hay que acertar.** Los días hábiles no son días naturales: hay
que saltar fines de semana y festivos colombianos, que son muchos. Y el mensaje
no debe salir si el prospecto ya respondió mientras tanto — eso importa más,
porque un seguimiento que ignora que la persona contestó se lee como que no la
están escuchando.

**Configurable por suite:** el plazo, el horario y el texto.

---

## CORE-F6 · Diagnóstico guiado antes de la reunión

**CORE · 🟡 Media · P3 · M**

Un formulario interactivo que recorre las preguntas clave para decidir si vale
la pena escalar a reunión y para llegar a ella con los requerimientos ya
entendidos.

**En Energy la prioridad es más baja que en Systems**, y es por una buena razón:
**Dimensionamiento ya cumple esa función**. Es la pieza que convierte una
conversación vaga en un alcance estimable, y encima devuelve una calificación.
Lo que falta aquí no es el formulario sino aprovechar mejor lo que ya devuelve
—que es CORE-CP3—.

**Configurable por suite:** las preguntas, que son el módulo entero.

---

## CORE-F7 · Trazabilidad de clientes recurrentes y recompra

**CORE · ⚪ Baja · P3 · M**

En el CRM: cuántas veces ha contratado un cliente, cuánto ha gastado en total, y
la tasa de recompra de la empresa.

Requiere cruzar el CRM con el módulo de contabilidad.

**En Energy rinde menos que en Systems**, y por eso baja a importancia baja aquí:
una instalación fotovoltaica es casi siempre una sola vez por cliente. Lo que sí
tiene valor en esta línea es otra cosa —**la referencia**: quién nos recomendó a
quién—, que es un problema parecido pero no el mismo.

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
que traerlo dentro.

**Recomendación de orden:** empezar por el final. La generación con datos metidos
a mano da valor mucho antes que la transcripción, y no depende de ella.

**En Energy hay un atajo:** el dimensionamiento **ya produce** la mayor parte de
los campos de una propuesta —potencia, paneles, inversión, ahorro, retorno,
impacto ambiental, incentivos—. Generar la propuesta de Energy es sobre todo
darle formato a algo que el sistema ya calcula. Aquí es donde primero se puede
cerrar el ciclo completo.

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
pilares y su público. Energy le habla a hogares y comercios sobre facturas de
luz, independencia y respaldo; Systems le habla a gerentes sobre tiempo perdido
en tareas manuales. **El motor es el mismo; el criterio editorial, no.**

---

## CORE-F10 · Reinventar Analytics hacia redes sociales

**CORE · 🟡 Media · P3 · L**

Los datos que muestra hoy no aportan. Lo que interesa son métricas globales de
redes sociales.

**Qué hacer:** conectar Facebook, Instagram y las demás; indicadores de impacto
por canal; y el estado de las campañas publicitarias activas.

**Está emparentado con CORE-F9:** la parte de métricas de la máquina de contenido
y este módulo son el mismo problema. Conviene diseñarlos juntos aunque se
entreguen por separado, o acabarán siendo dos integraciones distintas contra las
mismas APIs.

**Configurable por suite:** las cuentas conectadas y las campañas de cada línea.

---

# Sugerencias

## CORE-S1 · Compartir los componentes duplicados entre las dos suites

**CORE · 🟠 Alta · P2 · M**

El bug del campo "Tipo" en Systems —que ofrece las categorías fotovoltaicas de
Energy— no es un descuido aislado: es el síntoma de que `LeadDetailModal` y
compañía están **copiados en cada app** en vez de vivir en `packages/core`.

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

**El asistente de Energy estuvo horas en bucle de caída sin que nadie se
enterara.** PM2 lo mostraba "online" porque lo relanzaba una y otra vez, y el
único síntoma visible era un "Internal Server Error" genérico en otra pantalla
del panel.

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

# Orden sugerido para Energy

**Energy está a punto de contactar a los prospectos pendientes. El criterio es:
que la primera conversación de cada uno salga bien, porque no hay segunda
primera impresión.**

**Antes de contactar a nadie:** ENE-CP1 (rotar la clave, borrar los recibos con
datos personales), ENE-CP2 (las guías de los demás operadores, o el camino de
respaldo se rompe con quien no es de Afinia) y CORE-C1 (que no se pierdan los
mensajes que usted escriba a mano). Los tres son de horas.

**Esta semana:** ENE-CP4 —precios reales— es el más importante de todos, porque
cada cifra que salga con precios de referencia es una expectativa que habrá que
corregir después. Detrás, CORE-CP4 (PDF, que es como muchos van a mandar la
factura), CORE-CP3 (que el puntaje que ya se calcula se vea de una vez),
ENE-CP3, ENE-CP6, CORE-F2 y CORE-S2.

**Este mes:** CORE-F3 y CORE-F4 —en Energy se parte con ventaja porque ya se
recogen varios de los factores—, después CORE-CP1 y CORE-CP2. CORE-CP5 en
paralelo. Y arrancar el trámite de CORE-F1, que tiene tiempos que no dependen de
nosotros y que además condiciona cómo se hará el contacto en frío.

**Después:** CORE-F8 empezando por Energy, que es donde antes se puede cerrar el
ciclo completo —el dimensionamiento ya produce casi todos los campos de una
propuesta—. Luego CORE-F9 partido en tres y CORE-F10 diseñado con él.
