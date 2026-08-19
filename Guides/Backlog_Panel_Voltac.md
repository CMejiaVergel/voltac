# Backlog del panel de administración — Voltac Systems y Voltac Energy

Estado a 13 de agosto de 2026.

Recoge todo lo pendiente de las dos suites: correcciones, cambios ya decididos
que no se han terminado, funcionalidades nuevas y sugerencias. Los ítems que ya
tienen causa localizada llevan el archivo y la línea, para no volver a
diagnosticar lo mismo dos veces.

**Principio que atraviesa todo el listado:** las funcionalidades estructurales
van en las dos suites en paralelo. Solo difieren los módulos propios de cada
línea de negocio —Dimensionamiento en Energy, por ejemplo—. Cada suite mantiene
sus datos por separado.

---

## Cómo leer las etiquetas

**Importancia** — qué pasa si no se hace.

| | |
|---|---|
| 🔴 Crítica | Bloquea la operación, pierde datos o expone información |
| 🟠 Alta | Cuesta ventas o dinero cada semana que pasa |
| 🟡 Media | Mejora real, pero se puede operar sin ella |
| ⚪ Baja | Comodidad |

**Prioridad** — cuándo.

| | |
|---|---|
| **P0** | Antes de contactar los prospectos pendientes |
| **P1** | Esta semana |
| **P2** | Este mes |
| **P3** | Backlog, sin fecha |

**Dificultad** — esfuerzo, no complejidad conceptual.

| | |
|---|---|
| **S** | Horas |
| **M** | Uno o dos días |
| **L** | Una semana |
| **XL** | Varias semanas. Es un producto dentro del producto |

---

## Índice

| # | Ítem | Imp. | Pri. | Dif. |
|---|---|---|---|---|
| **Correcciones** ||||
| C1 | Los mensajes escritos desde el celular no llegan al panel | 🔴 | P0 | S |
| C2 | El panel muestra como enviados mensajes que no se entregaron | 🟠 | P1 | M |
| C3 | El campo "Tipo" de Systems ofrece las categorías de Energy | 🟡 | P1 | S |
| C4 | El preflight da un falso "Google sin conectar" | ⚪ | P2 | S |
| **Cambios pendientes** ||||
| CP1 | Rotar la clave de Energy y borrar los recibos de prueba | 🔴 | P0 | S |
| CP2 | Puntaje del prospecto visible en el CRM | 🟠 | P1 | M |
| CP3 | Módulo Cronograma, con calendario propio | 🟠 | P2 | L |
| CP4 | Propuesta comercial para prospectos prioritarios | 🟠 | P2 | M |
| CP5 | Guías de lectura del recibo de los demás operadores | 🟡 | P1 | S |
| CP6 | Portafolio de Energy en el catálogo del asistente | 🟡 | P1 | S |
| CP7 | Precios reales del área técnica en el motor | 🟠 | P2 | S |
| CP8 | Lectura de PDF con modelo especializado | 🟡 | P2 | M |
| CP9 | Entorno de pruebas aislado | 🟠 | P2 | L |
| CP10 | URI de Google de Energy a https | ⚪ | P2 | S |
| **Funcionalidades nuevas** ||||
| F1 | Migrar de Baileys a la API oficial de WhatsApp | 🔴 | P1 | L |
| F2 | Aviso por correo cuando entra un prospecto | 🟠 | P1 | S |
| F3 | Registrar en el CRM los prospectos que llegan por WhatsApp | 🟠 | P1 | M |
| F4 | Motor de calificación del prospecto, 1 a 100 | 🟠 | P2 | L |
| F5 | Fecha de seguimiento y mensaje programado automático | 🟠 | P2 | M |
| F6 | Diagnóstico guiado antes de la reunión | 🟡 | P2 | M |
| F7 | Trazabilidad de clientes recurrentes y recompra | 🟡 | P3 | M |
| F8 | Asistente de reuniones y generación de propuestas | 🟠 | P3 | XL |
| F9 | Máquina de contenido | 🟡 | P3 | XL |
| F10 | Reinventar Analytics hacia redes sociales | 🟡 | P3 | L |
| **Sugerencias** ||||
| S1 | Compartir los componentes duplicados entre las dos suites | 🟠 | P2 | M |
| S2 | Vigilancia: enterarse de que un asistente se cayó | 🟠 | P1 | M |
| S3 | Caché de prompt para bajar el costo del modelo | 🟡 | P2 | S |
| S4 | El informe de gasto, dentro del panel | ⚪ | P3 | S |

---

# Correcciones

## C1 · Los mensajes escritos desde el celular no llegan al panel

**🔴 Crítica · P0 · S**

Cuando una persona toma la conversación a mano desde el teléfono, esos mensajes
no aparecen en el panel. Pasó en el chat con Daniel Millán. Queda un hueco en la
trazabilidad justo en los momentos más importantes, que son aquellos en los que
alguien intervino.

**Causa localizada.** En `src/channels/whatsapp-web.ts:293`:

```ts
if (msg.key?.fromMe) {
  logger.debug({ jid }, 'Descartado: mensaje propio (fromMe)');
```

El filtro existe por una razón buena —sin él, el asistente se respondería a sí
mismo en bucle— pero es demasiado ancho: descarta el mensaje antes de
guardarlo, no solo antes de contestarlo.

**Lo que hay que hacer:** separar las dos decisiones. Un `fromMe` se guarda
siempre en el historial (como turno del asistente, marcado como escrito por una
persona) y nunca dispara un turno del modelo. El tipo `ConversationTurn` ya
tiene el campo para distinguir quién escribió de verdad.

**Ojo con esto:** hay que descartar los que envía el propio asistente, o se
guardarían dos veces. Se distinguen porque el asistente conoce el `messageId`
de lo que él mandó.

---

## C2 · El panel muestra como enviados mensajes que no se entregaron

**🟠 Alta · P1 · M**

Si falla el envío por WhatsApp, el mensaje ya quedó guardado en el historial y
el panel lo pinta igual que cualquier otro. Quien atiende cree que el cliente
leyó algo que nunca recibió. Pasó con una respuesta completa sobre financiación:
en el panel estaba, en el teléfono no.

**Ya resuelto a medias.** El asistente reintenta el envío una vez, y si aun así
falla deja constancia en la conversación para que el modelo no lo dé por leído.
Lo que falta es el lado visual: **el panel tiene que marcar esos mensajes**.

**Lo que hay que hacer:** llevar el estado de entrega en el turno (`entregado`,
`fallido`) y pintarlo distinto en la pestaña de Conversaciones. Mientras no
esté, el modelo actúa bien pero la persona que mira el panel se confunde.

---

## C3 · El campo "Tipo" de Systems ofrece las categorías de Energy

**🟡 Media · P1 · S**

Al editar un prospecto en el CRM de Systems, el desplegable "Tipo" muestra
`Residencial / Comercial / Industrial / Media Tensión`. Son las categorías de
proyecto fotovoltaico. En una empresa de software no significan nada.

**Causa localizada.** En
`apps/systems/src/app/admin/leads/LeadDetailModal.tsx:124`.

**Lo que hay que hacer:** definir las categorías propias de Systems y usarlas
ahí. Hace falta que usted diga cuáles son —automatización de procesos,
desarrollo a medida, integración, mantenimiento, o las que correspondan—.

**Vale la pena mirar la causa de fondo,** que está en S1: el modal está
duplicado en cada app en vez de compartido, así que un cambio en uno no llega
al otro y las dos suites divergen en silencio.

---

## C4 · El preflight da un falso "Google sin conectar"

**⚪ Baja · P2 · S**

`npm run preflight` recorre los dos clientes pero solo puede mirar la carpeta de
credenciales del perfil con el que arrancó. Sin `PERFIL=energy` dice que Energy
no tiene Google; con él, dice que el que no tiene es Systems. Las dos veces
miente sobre uno.

No rompe nada, pero ya nos costó tiempo: un aviso que no es cierto entrena a
ignorar los avisos.

**Lo que hay que hacer:** que la comprobación resuelva la carpeta de tokens de
cada cliente en vez de usar la del proceso, o que diga claramente que solo puede
verificar el perfil activo.

---

# Cambios pendientes

## CP1 · Rotar la clave de Energy y borrar los recibos de prueba

**🔴 Crítica · P0 · S**

Dos cosas de higiene, las dos con datos que no deberían estar donde están.

**La clave.** `CRM_API_KEY` de Energy quedó visible en pantalla dos veces
durante la depuración, así que está en el historial de la conversación de
trabajo. Es una clave interna que solo sirve contra `127.0.0.1:3000`, así que el
riesgo práctico es bajo, pero rompe la regla de que los secretos no pasan por el
chat.

```bash
cd /var/www/voltac-systems && VOLTAC_DATA_DIR=/var/www/voltac-data \
  node scripts/crear-clave-api.mjs energy "Asistente WhatsApp"
```

Se copia a `.env.energy` y se reinicia Energy. **Importante:** hacerlo sin que
nadie más lea esa terminal.

**Los recibos.** En `.data-energy/voltac-energy/recibos/` hay facturas de prueba
con nombre, dirección, estrato y consumo de una persona real. Se guardan a
propósito —el técnico las necesita para validar— pero las de prueba sobran.

---

## CP2 · Puntaje del prospecto visible en el CRM

**🟠 Alta · P1 · M**

Hoy el motor de dimensionamiento ya devuelve una calificación con puntaje, nivel
y una recomendación de si conviene ofrecer reunión. **Esa información no se ve
en ninguna parte del CRM.** Se calcula, se usa para decidir dentro de la
conversación, y se pierde.

**Lo que hay que hacer:** guardar la calificación en la ficha del prospecto y
mostrarla en el CRM de Energy, con su historial: qué puntaje tenía al principio
y cómo evolucionó. Esto es lo mínimo; el motor completo de calificación por
etapas es F4.

---

## CP3 · Módulo Cronograma, con calendario propio

**🟠 Alta · P2 · L**

Un módulo para planificar actividades y tareas internas —"elaborar la propuesta
comercial del cliente X, plazo hasta el jueves"— con su trazabilidad.

**Va en un calendario de Google aparte del de citas.** La razón es evitar que se
crucen: el asistente debe consultar **los dos** antes de crear una cita o una
actividad, para no agendar una reunión encima de una tarea ya comprometida ni al
revés. Mezclarlos en un solo calendario ensucia la pestaña de Calendario, donde
hoy solo hay compromisos con clientes.

**Estructural: va en las dos suites**, cada una con sus datos.

---

## CP4 · Propuesta comercial para prospectos prioritarios

**🟠 Alta · P2 · M**

Cuando un prospecto queda calificado como prioritario, el asistente le ofrece
una propuesta comercial o cotización formal y le pide los datos que hacen falta:
nombre completo, cédula o NIT, razón social.

Eso crea una **actividad** en el Cronograma (no una cita) asignando la tarea de
enviar el documento, **con plazo máximo de dos días** para que el prospecto no
se enfríe.

**Solo para prioritarios.** Elaborar estos documentos para quien no va a comprar
gasta el recurso más escaso de la empresa. Depende de CP2 y CP3.

---

## CP5 · Guías de lectura del recibo de los demás operadores

**🟡 Media · P1 · S**

Está la de Afinia. Faltan Air-e, EPM, Celsia y Enel, y sobre todo una
`recibo-generica.png` de respaldo.

Sin la genérica, a un cliente de otro operador se le manda la de Afinia, que lo
manda a buscar donde su factura no tiene nada: **peor que no mandarle ninguna**.

Van en `tenants/voltac-energy/assets/guias/` del repositorio del asistente. El
nombre del archivo tiene que contener el nombre del operador, porque así elige
la herramienta cuál mandar.

---

## CP6 · Portafolio de Energy en el catálogo del asistente

**🟡 Media · P1 · S**

Systems tiene su portafolio y lo envía por chat o adjunto en un correo. Energy
no tiene ninguno cargado, así que puede mandar correos pero sin adjunto.

Va en `tenants/voltac-energy/assets/`.

---

## CP7 · Precios reales del área técnica en el motor

**🟠 Alta · P2 · S**

El motor de dimensionamiento calcula con precios de referencia públicos. Ya
funciona y da cifras coherentes, pero **son de referencia, no de Voltac**.

Están en `packages/core/src/dimensionamiento/datos.ts`: precio por Wp según
tramo, factores por modalidad y tipo de techo, RETIE, medidor bidireccional,
trámite ante el operador.

Cambiar esos números ajusta a la vez el módulo del panel y lo que el asistente
le dice al cliente, que es exactamente lo que tiene que pasar.

---

## CP8 · Lectura de PDF con modelo especializado

**🟡 Media · P2 · M**

Las fotos de recibos ya se leen con `google/gemini-2.5-flash-lite`, que es seis
veces más barato que el modelo de conversación y mucho más rápido. **Ese mismo
modelo acepta PDF**, así que falta enganchar el camino: hay clientes que mandan
la factura en PDF desde el correo del operador, y hoy eso cae como "archivo
adjunto" sin leer.

El patrón ya está probado tres veces —audio con whisper, imagen con Gemini— y es
el mismo: un modelo especializado extrae, devuelve texto, y el asistente sigue
la conversación con eso.

---

## CP9 · Entorno de pruebas aislado

**🟠 Alta · P2 · L**

Hoy se prueba en producción. Ya costó caro: una sesión de WhatsApp robada
mientras Systems atendía clientes reales, y una cita de un cliente destruida.

Hace falta una copia completa —su propio número, sus propias carpetas de datos,
su propio calendario— donde romper cosas no tenga consecuencias.

Es la clase de trabajo que nunca parece urgente hasta el día en que sí.

---

## CP10 · URI de Google de Energy a https

**⚪ Baja · P2 · S**

En la consola de Google Cloud, una de las URI autorizadas de Energy está como
`http://energy.voltac.com.co/...`. Debería ser `https://`.

No molesta hoy porque la autorización vigente ya se hizo, pero va a fallar con
`redirect_uri_mismatch` la próxima vez que haya que reautorizar —que suele ser
el peor momento posible—.

---

# Funcionalidades nuevas

## F1 · Migrar de Baileys a la API oficial de WhatsApp

**🔴 Crítica · P1 · L**

Baileys es el canal **no oficial**: se conecta como dispositivo vinculado, igual
que WhatsApp Web. WhatsApp no lo autoriza, y usarlo con un número de producción
puede terminar en bloqueo de la cuenta.

Buena parte de los problemas de esta semana salen de ahí: sesiones de cifrado
que se rompen y dejan mensajes ilegibles, `Timed Out` que hacen perder envíos,
la sesión que se puede robar entre procesos, el QR que hay que volver a
escanear.

**Lo que cambia:** el primer mensaje a alguien que no ha escrito en 24 horas
exige plantilla aprobada por Meta, lo cual afecta directamente al flujo de
primer contacto con los prospectos. Hay costo por conversación. Y hay que
verificar el número y el negocio.

**Lo que se gana:** estabilidad, entrega garantizada, y dejar de operar sobre
algo que puede desaparecer de un día para otro.

El adaptador de la Cloud API ya existe en el código
(`src/channels/whatsapp-cloud.ts`), así que el trabajo es sobre todo de trámite,
plantillas y pruebas, no de arquitectura.

**Señal para acelerar:** si los `Timed Out` crecen al atender varios prospectos
a la vez. Se mide con:

```bash
pm2 logs voltac-asistente-energy --lines 200 --nostream | grep -ci "timed out"
```

---

## F2 · Aviso por correo cuando entra un prospecto

**🟠 Alta · P1 · S**

Hoy un prospecto nuevo aparece en el CRM y nadie se entera hasta que alguien
abre el panel.

**Lo que hay que hacer:** un correo al entrar el lead, con lo que dejó en el
formulario y un enlace directo a su ficha. El envío por Gmail ya está resuelto y
autorizado en el asistente; aquí es cuestión de disparar desde el sitio.

De los ítems del listado es de los más baratos y de los que más se notan.

---

## F3 · Registrar en el CRM los prospectos que llegan por WhatsApp

**🟠 Alta · P1 · M**

El CRM solo recoge lo que entra por los formularios de las páginas. Quien
escribe directo al WhatsApp hay que meterlo a mano, y se pierde.

**Lo que hay que hacer:** que el asistente recoja los datos necesarios durante
la conversación y cree la ficha solo.

**Con cuidado en la forma.** Los datos se piden porque hacen falta para
continuar —para pasar el estudio al área técnica, para mandar la propuesta—, no
anunciando que se van a registrar en un sistema. Es una conversación comercial
normal, no un formulario disfrazado. El asistente ya tiene la herramienta para
guardar datos de contacto; falta que sepa cuándo el interlocutor no viene de un
formulario y que complete la ficha.

---

## F4 · Motor de calificación del prospecto, 1 a 100

**🟠 Alta · P2 · L**

Una calificación que se recalcula **en cada etapa** de la conversación,
evaluando lo hablado contra unos ítems definidos, y que ajusta la prioridad del
lead automáticamente.

Hoy existe una calificación, pero solo la del dimensionamiento y solo en ese
momento. Esto es continuo.

**La parte difícil no es el código, son los ítems.** Hay que definir qué suma y
cuánto: es propietario, plazo con el que lo haría, si preguntó por financiación,
si pidió cotización, tamaño del consumo, si respondió rápido, si dio datos
completos. Esa lista es una decisión de negocio y conviene escribirla antes de
programar nada.

**Recomendación:** que el puntaje sea determinista y explicable —una suma de
factores visibles en el CRM— y no un número que decida el modelo. Un puntaje que
nadie puede auditar no se usa, y si el modelo cambia de humor la prioridad de
un cliente cambia sin motivo.

Depende de CP2 para tener dónde mostrarlo.

---

## F5 · Fecha de seguimiento y mensaje programado automático

**🟠 Alta · P2 · M**

Al enviar una propuesta comercial, el prospecto recibe automáticamente una fecha
de seguimiento **tres días hábiles después**, y en esa fecha sale un mensaje de
WhatsApp **dentro del horario laboral**.

**Detalles que hay que acertar:** los días hábiles no son días naturales —hay
que saltar fines de semana y festivos colombianos, que son muchos—, y el mensaje
no debe salir si el prospecto ya respondió mientras tanto. Lo segundo importa
más: un seguimiento automático que ignora que la persona ya contestó se lee como
que no la están escuchando.

El asistente ya tiene cadencia de toques con tope y espera configurable; esto se
apoya en eso.

---

## F6 · Diagnóstico guiado antes de la reunión

**🟡 Media · P2 · M**

Un formulario interactivo que recorre las preguntas clave para decidir si vale
la pena escalar a reunión y para llegar a ella con los requerimientos ya
entendidos.

Sirve para dos cosas a la vez: filtra a quien no va a comprar y evita que la
primera reunión se gaste en preguntas que podían haberse hecho antes.

---

## F7 · Trazabilidad de clientes recurrentes y recompra

**🟡 Media · P3 · M**

En el CRM: cuántas veces ha contratado un cliente, cuánto ha gastado en total, y
la tasa de recompra de la empresa.

**Para qué:** dar más prioridad a los mejores clientes. Un cliente que ya compró
dos veces vale más que un prospecto nuevo y hoy se tratan igual.

Requiere cruzar el CRM con el módulo de contabilidad, que es donde están las
cotizaciones y las facturas.

---

## F8 · Asistente de reuniones y generación de propuestas

**🟠 Alta · P3 · XL**

La siguiente etapa de la máquina de ventas: cerrar el ciclo desde que llega el
prospecto hasta que es cliente.

**Tres piezas encadenadas:**

1. Un asistente durante las reuniones —virtuales o presenciales— que transcriba
   y saque los puntos clave y los acuerdos.
2. Estructurar esa información en los campos que necesita una propuesta.
3. Generar la cotización o propuesta comercial con el formato y los lineamientos
   de la empresa.

**Lo importante:** la tercera pieza ya existe fuera de la plataforma. Hay una
skill de Claude hecha exclusivamente para esto, con los formatos, la estructura
y los lineamientos ya definidos y probados. **No hay que rediseñar ese
criterio**, hay que traerlo dentro: que el sistema arme el prompt de entrada con
los datos de la reunión y produzca el documento igual que hoy.

Empezar por el final —la generación con datos metidos a mano— y subir hacia la
transcripción da valor mucho antes que hacerlo en orden.

---

## F9 · Máquina de contenido

**🟡 Media · P3 · XL**

Evolución del módulo Contenido, que hoy solo permite planificar.

**El objetivo:** un sistema que conecte las herramientas de generación —video,
carruseles, imágenes—, busque inspiración, mida qué está funcionando con
métricas de impacto, y **ajuste con eso su propio algoritmo de generación de
ideas**, para que el contenido evolucione en vez de repetirse.

**El reparto de trabajo:** el sistema define qué hace falta de usted —"este
monólogo, en este plano, en este entorno"— y se encarga del resto. Programa el
contenido para aprobación, y una vez aprobado y ajustado, lo sube solo a las
redes conectadas.

Es un producto entero, no un módulo. Conviene partirlo: primero la programación
y aprobación, después la publicación automática, y al final el bucle de
métricas que ajusta las ideas.

---

## F10 · Reinventar Analytics hacia redes sociales

**🟡 Media · P3 · L**

Los datos que muestra hoy no aportan. Lo que interesa son métricas globales de
redes sociales.

**Lo que hay que hacer:** conectar Facebook, Instagram y las demás; indicadores
de impacto por canal; y el estado de las campañas publicitarias activas.

Está emparentado con F9: la parte de métricas de la máquina de contenido y este
módulo son el mismo problema, y conviene diseñarlos juntos aunque se entreguen
por separado.

---

# Sugerencias

## S1 · Compartir los componentes duplicados entre las dos suites

**🟠 Alta · P2 · M**

El bug C3 —Systems mostrando categorías de Energy— no es un descuido aislado: es
el síntoma de que `LeadDetailModal` y compañía están **copiados en cada app** en
vez de vivir en `packages/core`.

Mientras sigan duplicados, cada arreglo hay que hacerlo dos veces, y el día que
se olvide uno las dos suites divergen sin que nadie lo note. Eso choca de frente
con el principio de que los paneles son gemelos estructurales.

**Lo que hay que hacer:** mover a `packages/core` los componentes que son iguales
en las dos, y dejar en cada app solo lo que de verdad difiere —parametrizando
las categorías, por ejemplo, en vez de duplicando el modal—.

---

## S2 · Vigilancia: enterarse de que un asistente se cayó

**🟠 Alta · P1 · M**

El asistente de Energy estuvo horas en bucle de caída sin que nadie se enterara.
PM2 lo mostraba "online" porque lo relanzaba una y otra vez, y el único síntoma
visible era un "Internal Server Error" genérico en otra pantalla del panel.

**Lo que hay que hacer:** que el panel muestre si cada asistente está vivo de
verdad —no solo si el proceso existe— y que una caída sostenida avise por
WhatsApp al número interno, como ya hacen los fallos de herramienta.

Un sistema que se cae en silencio es peor que uno que se cae ruidosamente.

---

## S3 · Caché de prompt para bajar el costo del modelo

**🟡 Media · P2 · S**

Cada llamada al modelo reenvía el prompt completo, unos 6.400 tokens, y eso es
alrededor del 70% del costo de cada llamada. Un mensaje del cliente son varias
llamadas cuando hay herramientas de por medio.

Si el proveedor de Kimi en OpenRouter soporta caché de prefijo, esos tokens
repetidos costarían una fracción. **Hay que medirlo antes de prometerlo**, pero
es la palanca más grande que hay sobre el gasto —más que reducir el uso—.

---

## S4 · El informe de gasto, dentro del panel

**⚪ Baja · P3 · S**

Existe `npm run costos`, que desglosa el gasto del modelo por día, por
conversación, y marca los turnos que dieron demasiadas vueltas. Hoy solo se ve
por terminal.

Llevarlo al panel lo pone donde alguien lo va a mirar de verdad.

---

# Orden sugerido

**Antes de contactar los prospectos pendientes:** CP1 (rotar la clave, borrar
los recibos de prueba) y C1 (que no se pierdan los mensajes escritos a mano).
Son los dos que pierden o exponen datos, y eso no se recupera después.

**Esta semana, mientras corren los primeros prospectos:** F2 (aviso por correo)
y CP5/CP6 (guías y portafolio) porque son de horas y se notan de inmediato. C3 y
S2 detrás. Y arrancar el trámite de F1, que tiene tiempos de verificación que no
dependen de nosotros: cuanto antes empiece el reloj, mejor.

**Este mes:** CP2 y F4 juntos —la calificación no sirve de nada si no se ve, y
verla no sirve si no se recalcula—, luego CP3 y CP4, que dependen de ellas. CP9
en paralelo, porque cada semana que se pruebe en producción es una tirada de
dados.

**Después:** F8 empezando por el final, F9 partido en tres, F10 diseñado junto
con la parte de métricas de F9.
