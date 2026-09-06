# Reglas y ajustes — Asistente de Voltac Energy

Estado a 5 de septiembre de 2026.

Este documento existe para no volver a arreglar lo mismo dos veces. Cada ajuste
que se ha pedido queda aquí con **qué se pidió**, **qué se hizo**, **dónde vive**
y **cómo comprobarlo**. Si un comportamiento reaparece, se busca aquí primero: la
línea dirá si estaba resuelto —y entonces es una regresión— o si nunca lo estuvo.

Documentos hermanos: `Backlog_Energy.md`, `Backlog_Systems.md`.

---

## Cómo leer el estado

| | |
|---|---|
| ✅ | Hecho y verificado en una prueba real |
| 🟡 | Hecho, pendiente de verificar en la próxima prueba |
| ⚠️ | Hecho a medias: falta una parte que está identificada |
| ⏳ | Pendiente, no empezado |

**Dónde vive** distingue tres sitios, y la distinción importa más de lo que
parece:

- **Código** — determinista. No depende de que el modelo obedezca.
- **Prompt** — `tenants/voltac-energy/agent.yaml`. El modelo lo interpreta.
- **Datos** — la ficha del lead, el historial. Lo que el modelo lee como hechos.

---

## Índice por estado

| Estado | Cuántos |
|---|---|
| ✅ Verificado | 17 |
| 🟡 Hecho, sin verificar | 12 |
| ⚠️ A medias | 1 |
| ⏳ Pendiente | 3 |

> **Las 🟡 son las que importan ahora.** Casi todas viven solo en el prompt, y
> la experiencia de estas semanas dice que una regla que depende de que el
> modelo obedezca reincide. Verificarlas con conversaciones simuladas es el
> siguiente paso acordado.

---

# 1 · Cómo escribe

### ✅ 1.1 · Mensajes segmentados, no bloques

**Se pidió:** el mensaje de bienvenida es correcto pero largo; repartirlo en
varios mensajes para que se sienta natural.

**Se hizo:** los párrafos salen como mensajes distintos de WhatsApp, hasta tres,
juntando los que quedan muy cortos. No hace falta ninguna marca en el texto —se
probó con corchetes y acabaron llegándole a un cliente literalmente—.

**Dónde:** código, `partirEnMensajes()` en `src/channels/whatsapp-cloud.ts`.

**Cómo comprobarlo:** un mensaje con tres párrafos debe llegar como tres globos.

---

### ✅ 1.2 · Cada mensaje corto

**Se pidió:** mensajes demasiado largos, con varias ideas dentro.

**Se hizo:** regla dura de menos de 300 caracteres por mensaje y 600 por
respuesta. Una idea por párrafo.

**Dónde:** prompt.

---

### 🟡 1.3 · No todo mensaje termina en pregunta

**Se pidió:** típico de todo modelo de IA, termina preguntando en cada mensaje;
hay mensajes que son meramente informativos.

**Se hizo:** regla explícita de que un mensaje informativo termina informando, y
que la pregunta va cuando hace falta un dato para avanzar.

**Dónde:** prompt. **Es una instrucción, no una garantía:** no hay forma
determinista de distinguir una pregunta necesaria de una de relleno.

---

### ✅ 1.4 · Esperar a que el cliente termine de escribir

**Se pidió:** que no conteste un mensaje por cada mensaje; que espere 2–3
minutos, consolide y responda; y que si sigue escribiendo, extienda la espera.

**Se hizo:** el mecanismo ya existía y era correcto —cada mensaje nuevo reinicia
la cuenta, con un tope duro—. **Los números eran el problema:** 20 segundos.
Ahora 150, con tope de 7 minutos. El límite configurable del panel subió a 5 y
15 minutos.

**Dónde:** código, `InboundBuffer` en `src/pipeline/debounce.ts`. Ajustable desde
el panel sin desplegar.

---

### 🟡 1.5 · No repetir lo ya enviado

**Se pidió:** hubo mensajes repetidos.

**Se hizo:** después de mandar un avance y llamar a una herramienta, el modelo
recomponía la respuesta entera incluyendo lo ya dicho. Se le advierte en el
prompt **y además** se compara y se descarta lo repetido —sin acentos ni
puntuación, y aceptando que uno contenga al otro—.

**Dónde:** código, `repetido()` en `src/agent/runtime.ts`.

---

### 🟡 1.6 · Reaccionar con naturalidad a lo inesperado

**Se pidió:** ante el mensaje automático de ausencia, el asistente reaccionó de
forma antinatural, como forzando hacerse pasar por una persona.

**Se hizo:** regla de no explicar, no disculparse y no justificarse ante un
mensaje automático. Seguir la conversación como si nada.

**Dónde:** prompt.

---

# 2 · Qué dice y qué no

### ✅ 2.1 · Ninguna cifra sin haberla calculado

**Se pidió:** se le dijo a un prospecto que ahorraría 80.000 al mes cuando el
motor, con sus mismos datos, devuelve 314.761.

**Se hizo:** tercera red de seguridad determinista, junto a las de citas
fantasma y correos que nunca salieron. Un mensaje con cifras —dinero, potencia,
paneles, años de retorno— sin haber llamado a `dimensionar_sistema` en esa
conversación se le devuelve al modelo con la orden de calcular o borrar el
número.

**Dónde:** código, `mencionaCifras()` en `src/agent/runtime.ts`.

**Por qué importa tanto:** una cifra inventada no se descubre sola como una cita
fantasma —nadie se presenta a una sala vacía—. Se descubre en la reunión, cuando
el técnico da el número real y no se parece.

---

### 🟡 2.2 · El consumo también es una cifra

**Se pidió:** el asistente afirmó un consumo de 200 kWh que nadie había dicho.

**Se hizo:** el consumo estaba excluido del guardián a propósito, porque
repetirle al cliente el dato que acaba de dar es correcto. Ahora se distingue:
si el número no aparece en nada de lo que escribió el cliente, no salió de él.

**Dónde:** código, `inventaConsumo()` en `src/agent/runtime.ts`.

---

### ✅ 2.3 · Los huecos se declaran, no se callan

**Se pidió:** implícito en lo anterior.

**Se hizo:** cuando no hay consumo, ni ciudad, ni dirección, el contexto lo dice
con todas las letras en vez de omitirlo. **El modelo rellena exactamente los
huecos que nadie nombra.**

**Dónde:** código, `src/leads/contacto.ts`.

---

### ✅ 2.4 · Financiación: sí, sin detalle, a la reunión

**Se pidió (dos veces):** decir que sí hay financiación, que depende del perfil,
y llevar a una reunión. Sin modalidades, plazos ni tasas. Y no sacar el tema si
el cliente no lo saca.

**Se hizo:** bloque `financiacion` con respuesta de dos frases y cero números.
**Y se eliminó `flujo-financiacion`**, que enumeraba leasing y líneas de
eficiencia energética y comparaba la cuota con el ahorro. Dos bloques con
instrucciones opuestas sobre lo mismo eran la causa de que reincidiera.

**Dónde:** prompt.

---

### 🟡 2.5 · La objeción de precio

**Se pidió:** ante "está caro" o "otra empresa me cotizó más barato", explicar
brevemente por qué lo nuestro vale lo que vale e invitar a comparar en una
reunión.

**Se hizo:** bloque `precio-alto` con la propuesta de valor resumida: marcas
aliadas porque el equipo barato termina en garantías y en meses de desgaste;
acompañamiento completo —certificación, RETIE, trámite ante el operador— hasta
que quede funcionando y legalizado; dos años de mantenimiento incluidos, con el
recargo por viáticos fuera de ciudades principales dicho de frente. Cierre
invitando a comparar en Meet. Prohibido bajar el precio o insinuar margen.

**Dónde:** prompt.

---

### 🟡 2.6 · El estudio lo hace el asistente

**Se pidió:** no tiene sentido anunciar que "el área técnica" preparará el
dimensionamiento; la idea es que el mismo agente asesore y presente el estudio
preliminar.

**Se hizo:** se quitó esa formulación y se prohibió derivar a "el área técnica",
"los ingenieros" o "un asesor". El área técnica entra después —visita, propuesta
firme— y eso no se anuncia en el primer mensaje.

**Dónde:** prompt.

---

### 🟡 2.7 · No ceder cuando el cliente contradice

**Se pidió:** el cliente dijo "yo mandé mi recibo por el formulario" y el
asistente le dio la razón sin más.

**Se hizo:** regla de que casi siempre el cliente tiene razón en el hecho y no
en la consecuencia —mandó el recibo, sí, pero de ese recibo no se pudo sacar el
dato—. Decírselo tal cual y pedir la confirmación. Si se tensa, escalar en vez
de discutir.

**Dónde:** prompt.

---

# 3 · Qué pregunta y qué no

### ✅ 3.1 · Nunca el precio del kWh

**Se pidió:** asumir la tarifa; no pedirle ese dato al cliente.

**Se hizo:** tarifa fija de **935 $/kWh**, y se eliminaron **seis** lugares del
prompt que empujaban a pedirla: la guía del "CU o Costo Unitario", la regla de
"hacen falta dos datos", dos reglas que esperaban tarifa antes de calcular, y el
campo en el formulario de captura.

**Dónde:** código (`TARIFA_KWH_REFERENCIA` en `src/config/env.ts`) y prompt.

---

### 🟡 3.2 · Nunca el área disponible

**Se pidió:** el espacio mínimo va en la propuesta y se verifica en la visita
técnica; preguntarlo pide un dato que casi nadie sabe.

**Se hizo:** regla en el prompt y la descripción del parámetro de la herramienta
marcada como "NO se lo preguntes".

**Dónde:** prompt y `src/tools/builtin/dimensionar.ts`.

---

### 🟡 3.3 · Nunca si el inmueble es propio

**Se pidió:** irrelevante en esta etapa; quien busca esto casi siempre es el
dueño.

**Se hizo:** regla en el prompt y campo eliminado del formulario de captura.
Sigue contando para el puntaje si el cliente lo menciona por su cuenta.

**Dónde:** prompt.

---

### ✅ 3.4 · Nunca el nombre si ya lo tenemos

**Se pidió:** el lead se contacta por su nombre; pedirlo es absurdo.

**Se hizo:** regla explícita, con la excepción de que no haya llegado o no se
entienda como nombre de persona.

**Dónde:** prompt.

---

### ✅ 3.5 · Nunca una segunda foto del recibo

**Se pidió:** si ya adjuntó una foto en el formulario, no pedirle más.

**Se hizo:** el dato de que adjuntó factura viaja desde el CRM y el cierre del
primer mensaje cambia: en vez de pedir la foto, confirma que ya se tiene y
pregunta qué lo llevó a mirar lo solar.

**Dónde:** código (`reciboAdjunto`) y prompt (`preguntaConDatos`).

---

# 4 · El dimensionamiento

### ✅ 4.1 · Se dimensiona por el pico, no por el promedio

**Se pidió:** siempre se toma el pico de los últimos meses del recibo.

**Se hizo:** la descripción de la herramienta lo exige y el extractor del recibo
devuelve `consumoPicoKwh` desde la gráfica de barras.

**Dónde:** código y prompt.

---

### ✅ 4.2 · Sobredimensionamiento del 20%

**Se pidió:** un excedente de alrededor del 20% hacia arriba.

**Se hizo:** `cubrimiento: 1.2` en la llamada del asistente. El módulo del panel
sigue en 1,0 a propósito: ahí decide un técnico con el recibo delante.

**Dónde:** código, `src/tools/builtin/dimensionar.ts`.

---

### 🟡 4.3 · El sobredimensionamiento se explica como colchón

**Se pidió:** el mensaje sobre excedentes que se liquidan a menos confunde; el
sistema se sobredimensiona por si algún mes se dispara el consumo.

**Se hizo:** se explica como colchón —diciembre con visitas y el aire prendido
todo el día— y kilovatios acumulados a favor. **Prohibido** mencionar a cuánto se
liquida el excedente o que cada kilovatio extra rinde menos. Eso se conversa en
la reunión.

**Dónde:** prompt. *La frase original salía del motor de cálculo, escrita para un
técnico.*

---

### 🟡 4.4 · Preguntar el tipo de sistema antes de dar cifras

**Se pidió:** confirmar si quiere con baterías, conectado a la red o híbrido,
explicando brevemente cada uno sin tecnicismos.

**Se hizo:** una frase por opción —el de red es el más económico y lo que sobra
queda a favor; el de baterías cuesta más y deja de depender de la empresa de
energía; el híbrido es el punto medio con respaldo— y si no sabe, se recomienda
y se sigue.

**Dónde:** prompt.

---

# 5 · El proceso comercial

### ✅ 5.1 · Se ofrece reunión, no "que lo contacten"

**Se pidió:** preguntar si lo contactan es redundante cuando ya lo estás
contactando; lo que se ofrece es una reunión virtual por Meet.

**Se hizo:** regla explícita, y prohibido decir que alguien escribirá por correo.

**Dónde:** prompt.

---

### ⚠️ 5.2 · A todo interesado se le manda cotización

**Se pidió:** agende o no, se le envía la cotización entre 24 y 48 horas, y esa
actividad queda **agendada como tarea** en el calendario.

**Se hizo:** el mensaje al cliente, sí. **La tarea, no.** Hoy el único rastro es
la conversación: nadie la recoge automáticamente.

**Falta:** el módulo de Tareas (§7.1). Hasta entonces, es una promesa al cliente
que depende de que alguien la vea en el panel.

---

### 🟡 5.3 · Ofrecer la cotización formal tras el estimado

**Se pidió:** muchos preguntan por curiosidad y con el número ya tienen lo que
querían; preguntar si quiere la cotización formal separa a quien va en serio.

**Se hizo:** regla de preguntarlo justo después de dar el estimado.

**Dónde:** prompt.

---

# 6 · Fiabilidad del canal

### ✅ 6.1 · El primer mensaje de Energy habla de Energy

**Se pidió:** el mensaje de contacto de Energy vendía automatización de procesos.

**Se hizo:** bloque `outreach` por tenant. Antes había una constante compartida
con el texto de Systems.

**Dónde:** código y prompt.

---

### ✅ 6.2 · "Esperando este mensaje" ya no es permanente

**Se pidió:** un mensaje quedó indefinidamente sin descifrar en el teléfono.

**Se hizo:** faltaba `getMessage` en la configuración del socket. Cuando el
teléfono del cliente no logra descifrar, pide el mensaje otra vez; sin esa
función devolvíamos nada y el reintento moría. Ahora se guarda el contenido de
lo enviado —400 mensajes— y se sirve.

**Dónde:** código, `src/channels/whatsapp-web.ts`.

**Limitación conocida:** el registro es en memoria. Un reintento que llegue
después de reiniciar el proceso sigue sin poder atenderse.

---

### 🟡 6.3 · El panel muestra lo mismo que el teléfono

**Se pidió:** en WhatsApp se ven tres mensajes y en el panel uno solo.

**Se hizo:** un turno por mensaje, partido con la misma función que usa el canal.
Se arregló primero en el turno de conversación y **se olvidó la ruta del primer
contacto** —justo el mensaje más largo—; ya está corregida también y verificada
en el teléfono: el primer contacto sale en tres globos.

**Falta:** marcar en el panel los mensajes que **no se entregaron**. Hoy un fallo
de entrega se sigue pintando igual que un mensaje entregado. Es CORE-C2 del
backlog y **volvió a pasar en la última prueba**.

**Dónde:** código, `src/agent/runtime.ts` y `src/leads/contacto.ts`.

---

### ✅ 6.4 · Lo que se escribe desde el teléfono llega al panel

**Se pidió:** trazabilidad completa de las intervenciones manuales.

**Se hizo:** el canal distingue el eco de nuestro propio envío de un mensaje
escrito a mano. Lo segundo se guarda como turno del asistente marcado como
persona y **pausa el asistente** en esa conversación.

**Dónde:** código, `src/channels/whatsapp-web.ts` y `src/pipeline/orchestrator.ts`.

---

### ✅ 6.5 · Borrar una conversación borra de verdad

**Se pidió:** verificar que el borrado no deja contexto vivo.

**Se hizo:** el borrado ya limpiaba historial, ficha y alias. Faltaban dos cosas
invisibles: el **cupo de lectura de recibos**, que vive en memoria y hacía que el
asistente se negara a mirar la siguiente foto sin explicación posible; y las
**copias de las facturas**, que llevan nombre, dirección y estrato.

**Dónde:** código, `olvidarConversacion()` en `src/media/recibo.ts`.

---

# 7 · Lectura del recibo

### 🟡 7.1 · El recibo del formulario se lee

**Se pidió:** que el mismo mecanismo que lee la foto del chat se ejecute al
pulsar *redactar mensaje* desde el CRM —y no al subir el archivo, para no exponer
el gasto de tokens a una subida masiva—.

**Se hizo:** exactamente ese flujo. La ruta del adjunto viaja del CRM al
asistente, se descarga, se lee con el modelo de visión y los datos quedan en el
hilo para toda la conversación.

**Dónde:** código, `leerDesdeUrl()` en `src/media/recibo.ts`.

---

### ✅ 7.2 · El lector, endurecido contra inyección

**Se pidió:** reglas duras por si suben un documento con prompt injection.

**Se hizo:** dos barreras. La instrucción declara que todo lo escrito en la
imagen son datos y nunca órdenes, y ordena rechazar la imagen si contiene
instrucciones. Y **por código**, los campos de texto se recortan a etiquetas
cortas de una línea sin caracteres de control: un intento de inyección acaba
siendo un "operador" absurdo de 40 caracteres.

**Dónde:** código, `INSTRUCCION` y `textoSeguro()` en `src/media/recibo.ts`.

*La segunda barrera es la que cuenta: no depende de que el modelo obedezca.*

---

### 🟡 7.3 · Se avisa de lo que no se pudo leer

**Se pidió:** informar al personal qué datos no se pudieron extraer.

**Se hizo:** el resultado viaja al panel y se muestra **sobre el borrador**,
antes de autorizar: verde si se leyó —con la lista de lo que faltó— y ámbar si no,
con el motivo.

**Dónde:** código y `WhatsAppContacto.tsx` en el panel.

---

### ✅ 7.4 · Dos recibos por conversación

**Se pidió:** dos imágenes procesadas con éxito; las ilegibles no cuentan pero
tienen su propio límite.

**Se hizo:** `TOPE_EXITOS = 2`, `TOPE_ILEGIBLES = 3`. Un fallo técnico no gasta
ninguno de los dos.

**Dónde:** código, `src/media/recibo.ts`.

---

### ✅ 7.5 · La factura del formulario no gasta el cupo de fotos

**Se pidió:** implícito — el asistente decía "ya tengo tu recibo" y a la vez
pedía el consumo.

**Se hizo:** el tope de dos lecturas existe para que un cliente no gaste tokens
mandando fotos por el chat. La factura del formulario es **un** archivo que ya
está en nuestro servidor, y aun así contaba: al tercer clic en *redactar
mensaje* el asistente se negaba a leerla. Ahora no cuenta, y el resultado se
guarda por URL para no volver a mirarla.

**Dónde:** código, `src/media/recibo.ts`.

*Este fallo parecía una alucinación del modelo y no lo era. Es el tercero de esa
clase.*

---

### ✅ 7.6 · De los dos consumos de una factura, cuál se usa

**Se hizo:** de un recibo salen el consumo del periodo y el pico del histórico,
y solo el segundo sirve. Iban seguidos y con el mismo peso; ahora el pico va
primero y marcado, y el del periodo dice explícitamente que no es ese. En la
factura de prueba son 231 contra 272: un panel entero.

**Dónde:** código, `resumirRecibo()` en `src/pipeline/debounce.ts`.

---

### ✅ 2.8 · El primer mensaje no señala lo que falta

**Se pidió:** quitar "no dejaste nota en el formulario, así que no sé qué te
trajo". Innecesario y crea fricción en la primera frase.

**Se hizo:** si no dejó nada, ese punto del mensaje se salta entero. Lo que
falte se pregunta al final, como si nada.

**Dónde:** `instruccionPrimerMensaje()` en `src/leads/contacto.ts`.

---

### ✅ 5.4 · Módulo de Tareas

**Se pidió:** una pestaña entre Calendario y Configuración donde queden las
tareas de la persona a cargo: recibo ilegible con entrada manual de datos, un
botón de "no se pudo resolver" que hace que el asistente le pida el dato al
cliente, y los escalamientos.

**Se hizo:** los tres. Lo que se escribe al resolver una tarea de recibo no se
queda en la tarea: se copia a la ficha del prospecto, que es de donde el
asistente lee al redactar.

**Dónde:** `packages/core/src/tareas/` en el sitio web.

**Alcance acordado:** Tareas es **del asistente de WhatsApp**. El Cronograma es
otro módulo, más general, para actividades del equipo que no son atención al
cliente. No se mezclan.

---

# 8 · Pendientes

### ⏳ 8.1 · Módulo de Tareas

Una pestaña entre Calendario y Configuración donde se asignan tareas a la
persona a cargo del panel. Tres usos ya identificados:

1. **Recibo ilegible** — se asigna la tarea, la persona abre el documento del
   lead, escribe a mano el **consumo pico** y la **dirección**, y al resolverla
   esos datos van al asistente como contexto para redactar el primer mensaje.
2. **No se pudo resolver** — un botón que hace que el asistente le diga al lead
   "recibimos tu recibo pero no pudimos leer *tal* dato, ¿me lo confirmas?".
3. **Escalamiento** — cuando la conversación se tensa, el asistente escala y
   queda una tarea para que una persona atienda el chat.

Y el que ya está prometido al cliente: **enviar la propuesta comercial en 24–48
horas** (§5.2).

Se relaciona con **CORE-CP1** del backlog, el módulo Cronograma. Conviene
diseñarlos juntos: uno son tareas internas del panel y el otro actividades con
plazo en un calendario aparte, pero el modelo de datos es el mismo.

---

### ⏳ 8.2 · Marcar en el panel los mensajes no entregados

CORE-C2. El estado de entrega ya existe en el turno —`no_enviado`— y el panel ya
sabe pintarlo. Falta el caso del **fallo de entrega real**: hoy se reintenta una
vez y se deja constancia para el modelo, pero el turno no queda marcado.

---

### ⏳ 8.3 · Propuesta comercial automática

Generación automática, aprobación humana y envío.

**Congelada a propósito** hasta que el asistente esté pulido. La razón la puso
el usuario y es la correcta: con un cliente real, hoy el asistente se rompe. Y
hay otra que refuerza la misma decisión: esa función *escribe documentos con
cifras* hacia el cliente, así que hereda todos los defectos que sigan vivos en
el dimensionamiento. Construirla ahora multiplicaría los errores en vez de
sumar una función.

Depende de §8.1 y de **CORE-CP2** del backlog.

---

### ⏳ 8.4 · Validar con conversaciones simuladas

Las reglas marcadas 🟡 viven solo en el prompt y no se han comprobado en una
conversación real completa. Probarlas en producción con el número del usuario
resultó lento y frustrante.

**Acordado:** definir una *conversación típica* —cómo escribe de verdad un
prospecto: un "hola", una pausa de treinta segundos, un segundo mensaje— y
usarla como guion base para simular contra el asistente, ajustando reglas y
prompt según lo que salga.

---

# 9 · Configuración vigente

| Parámetro | Valor | Dónde se cambia |
|---|---|---|
| Modelo principal | GLM 4.7 | Panel → Configuración |
| Modelo de respaldo | Kimi K2.5 | Panel → Configuración |
| Tarifa de referencia | 935 $/kWh | `TARIFA_KWH_REFERENCIA` |
| Sobredimensionamiento | 1,20 | `src/tools/builtin/dimensionar.ts` |
| Silencio antes de responder | 150 s | Panel → Configuración |
| Espera máxima | 420 s | Panel → Configuración |
| Recibos leídos por conversación | 2 | `TOPE_EXITOS` |
| Imágenes ilegibles antes de rendirse | 3 | `TOPE_ILEGIBLES` |
| Mensajes por respuesta | máx. 3 | `MAX_PARTES` |
| Mensajes de avance por turno | máx. 2 | `MAX_AVANCES` |
| Toques de contacto sin respuesta | 3 | Panel → Configuración |

---

# 10 · Cómo comprobar que sigue funcionando

Cuatro comandos que convierten una sospecha en un diagnóstico:

```bash
npm run probar:modelo     # el modelo existe, contesta y sabe usar herramientas
npm run probar:agenda     # agenda de verdad, no solo lo promete
npm run probar:correo     # envía de verdad, y si falla alguien se entera
npm run probar:recibo     # lee una factura de ejemplo
npm run costos            # en qué se fue el gasto del modelo
```

Con `DEFAULT_TENANT=voltac-energy` delante para probar esta línea de negocio.
