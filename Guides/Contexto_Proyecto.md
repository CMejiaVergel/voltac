# Contexto del proyecto — Voltac

Documento de traspaso. Escrito para que una sesión nueva pueda trabajar sin
repetir el descubrimiento de cinco semanas.

Actualizado el 6 de septiembre de 2026.

Hermanos: `Reglas_Asistente_Energy.md` (qué hace el asistente y por qué),
`Backlog_Energy.md`, `Backlog_Systems.md` (qué falta).

---

## 1 · Qué es esto

Dos líneas de negocio de la misma empresa, cada una con su sitio web, su panel
de administración y su asistente de WhatsApp:

- **Voltac Systems** — software y automatización. Ya atiende clientes reales.
- **Voltac Energy** — fotovoltaica. **Todavía no atiende a nadie**; está a punto
  de empezar con unos prospectos pendientes. Casi todo el trabajo reciente es
  aquí.

Son **gemelos estructurales**: el mismo código, distinta configuración. Cuando
algo se arregla en uno, mírese si aplica al otro.

---

## 2 · Los dos repositorios

### `voltac-asistente-whatsapp` — el asistente

TypeScript, Node 20, Fastify (solo en loopback), Baileys para WhatsApp,
OpenRouter para el modelo, almacenamiento en archivos.

```
src/
  agent/runtime.ts        el turno: modelo -> herramienta -> modelo
  agent/memoria.ts        compactación del historial
  blocks/                 el prompt se compila desde bloques YAML
  channels/whatsapp-web.ts   Baileys (el que está en uso)
  channels/whatsapp-cloud.ts API oficial (existe, sin usar)
  leads/contacto.ts       primer contacto y seguimientos
  media/recibo.ts         lectura de facturas con modelo de visión
  pipeline/orchestrator.ts  une canal + memoria + agente
  pipeline/debounce.ts    agrupa los mensajes del cliente
  server/crm.ts           API que consume el panel
  tools/                  las herramientas del modelo
tenants/
  voltac/agent.yaml       configuración de Systems
  voltac-energy/agent.yaml  configuración de Energy
```

**Dos procesos sobre una sola copia del código.** Se separan con `PERFIL`:
`.env` es la base y `.env.energy` la sobrescribe. `DATA_DIR` es lo único que de
verdad los separa; todo lo demás cuelga de ahí.

### `voltac` — los sitios y los paneles

Next.js 16 (App Router), React 19, Tailwind 4, SQLite. Monorepo con
`apps/systems`, `apps/energy` y `packages/core`.

**Casi todo vive en `packages/core`** y cada app lo monta con un archivo puente
de dos líneas. Si edita algo en `apps/*` que no sea un puente, probablemente
está duplicando.

Las bases están separadas **físicamente** por marca:

```
DATA_DIR/
  contabilidad.db      común
  sistema.db           usuarios del panel y auditoría, común
  contenido.db         calendario editorial, común
  systems/voltac.db    prospectos, proyectos y noticias de Systems
  energy/voltac.db     ídem de Energy
```

Un `SELECT ... FROM quotes` en el panel de Systems no puede devolver un
prospecto de Energy porque esas filas están en otro archivo. Es deliberado.

---

## 3 · El servidor

`root@158.220.113.5` (Contabo, Ubuntu 24.04). Todo con PM2.

| Proceso | Qué es | Carpeta |
|---|---|---|
| `voltac-asistente` | bot de WhatsApp de Systems | `/var/www/voltac-asistente` |
| `voltac-asistente-energy` | bot de WhatsApp de Energy | *(la misma, con `PERFIL=energy`)* |
| `voltac-systems` | sitio web + panel de Systems | `/var/www/voltac-systems` |
| `voltac-energy` | sitio web + panel de Energy | *(la misma)* |
| `voltac-innovation` | otro sitio · **14 reinicios, se cae en silencio** | |
| `metalprest`, `pato-asistente`, `pato-panel` | detenidos a propósito | |

**Los nombres se parecen y no son lo mismo.** `voltac-energy` es el SITIO, no el
bot. Confundirlos ya costó un diagnóstico entero.

### Desplegar

```bash
# el asistente (los dos bots)
cd /var/www/voltac-asistente && npm run desplegar

# los sitios (los dos paneles)
cd /var/www/voltac-systems && git pull && npm ci && npm run build && pm2 restart voltac-systems voltac-energy
```

Cuando un cambio cruza los dos repositorios —y varios lo hacen— **hay que
desplegar los dos**. Olvidarlo produce síntomas que parecen otra cosa.

---

## 4 · Reglas de seguridad — no negociables

- **Nunca** comprometer `.env`, `.env.*` (salvo `*.example`), `.sessions/`,
  `.tokens/`, `.data/`, `.data-energy/`, `uploads/`, `*.db`.
- Al reparar sesiones de WhatsApp: **nunca** tocar `creds.json` —es la
  vinculación del dispositivo, borrarlo obliga a escanear el QR— ni
  `session-573052461088.*` (dispositivo de Systems) ni `session-573136253584.*`
  (dispositivo de Energy).
- Los secretos se escriben en el servidor con entrada oculta. **Nunca se pegan
  en el chat.** Antes de dar un comando que imprima un secreto, avisar; y no
  leer el terminal ese turno.
- La llave de despliegue es de solo lectura. "Allow write access" queda
  desmarcado.
- El asistente escucha en `HOST=127.0.0.1`. No se expone por Nginx.
- **No correr el asistente en local mientras el del VPS está vivo:** comparten
  la sesión de WhatsApp y se la roban en bucle.
- `HANDOFF_NOTIFY_NUMBER=573137297257` es el número de pruebas **y** el del
  usuario. Un aviso interno que le llegue a ese número no es una fuga.
- El chat de **Daniel Millan Villalba** es intocable: cliente potencial real.

---

## 5 · Cómo se prueba

Cuatro comandos convierten una sospecha en un diagnóstico. Úsense antes de
teorizar:

```bash
npm run probar:modelo                  # existe, contesta y sabe usar herramientas
npm run probar:modelo -- --buscar glm  # catálogo de OpenRouter con precios
npm run probar:agenda                  # agenda de verdad, no solo lo promete
npm run probar:correo                  # envía de verdad, y si falla alguien se entera
npm run probar:recibo -- --lead 23     # lee la factura que subió por la web
npm run costos                         # en qué se fue el gasto del modelo
npm run preflight                      # configuración, saldo, build al día
```

Con `PERFIL=energy` delante para la línea solar. **Se corren desde
`/var/www/voltac-asistente`**, no desde el sitio.

---

## 6 · Estado actual del asistente de Energy

**Funciona:** primer contacto desde el CRM con aprobación humana, lectura de la
factura del formulario y del chat, dimensionamiento preliminar, agendamiento en
Google Calendar, envío de correo con adjunto, escalamiento a persona, y el
módulo de Tareas.

**Configuración vigente:** GLM 4.7 de principal con Kimi K2.5 de respaldo;
tarifa asumida de 935 $/kWh; sobredimensionamiento 1,20 sobre el consumo pico;
150 s de silencio antes de responder con tope de 420 s.

**Lo que sigue costando:** que el modelo respete reglas que solo viven en el
prompt. Ver el apartado 8.

---

## 7 · Errores que ya se pagaron

No repetirlos vale más que cualquier funcionalidad nueva.

**La descripción de una herramienta pesa más que el prompt.** Tres veces:
`agendar_cita`, `enviar_correo`, `precioKwh`. Si el modelo hace algo raro con
una herramienta, la causa está en su `description`, no en el YAML.

**Dos instrucciones que se contradicen son peores que ninguna.** Había dos
bloques sobre financiación diciendo lo contrario; el modelo elegía. Al eliminar
el viejo, el comportamiento se arregló solo.

**Un hueco silencioso lo rellena el modelo.** Si no se sabe el consumo, hay que
decírselo con todas las letras. Y hay que enumerar **todo** lo que falta: se
declaró solo el consumo y siguió inventando la ciudad.

**Los datos viejos son inmortales si nadie los borra.** Un registro del 12 de
agosto sobrevivió tres semanas, cuatro despliegues y varios borrados de
conversación, porque la fusión de fichas hacía `existente ?? nuevo`. Costó tres
rondas y dos diagnósticos equivocados.

**Un estado en memoria que sobrevive a un borrado es indetectable.** El cupo de
lectura de recibos hacía que el asistente se negara a mirar una foto sin que
nada en pantalla lo explicara.

**Antes de concluir, medir.** Dos diagnósticos de esta sesión fueron erróneos
por deducir de indicios: se dio por hecho que el modelo inventaba datos cuando
los leía de una ficha real. La regla: construir la forma de observar y luego
mirar.

---

## 8 · La lección que gobierna el resto

Se contaron las causas de las 28 correcciones pedidas:

| Causa | Cuántas |
|---|---|
| Datos viejos o huecos en el contexto | 4 |
| Instrucciones nuestras contradictorias o equivocadas | 9 |
| Fallos de código | 6 |
| El modelo desobedeciendo una regla clara | 3 |

**Casi nada fue culpa del modelo.** Cambiarlo no habría arreglado nada.

Y el patrón más útil que salió de ahí: **ninguna regla que dependa de que el
modelo obedezca ha aguantado sin reincidir; ninguna de las que están en código
ha fallado.** Cuando algo importe de verdad —una cifra, una promesa, un envío—
va en código, con una comprobación determinista que devuelva el turno si el
modelo se sale. Ya hay tres de esas redes: citas fantasma, correos que nunca
salieron y cifras inventadas.

---

## 9 · Lo que viene

**Inmediato**, antes de contactar prospectos reales:

1. Validar el comportamiento con conversaciones **simuladas**, no en
   producción. El usuario pidió una "conversación típica" acordada como base
   para las pruebas.
2. Marcar en el panel los mensajes que no se entregaron (**CORE-C2**).
3. Guías de lectura del recibo de Air-e, EPM, Celsia y Enel, y una genérica
   (**ENE-CP2**).
4. Rotar la clave de API de Energy y borrar los recibos de prueba con datos
   personales (**ENE-CP1**).
5. Precios reales del área técnica en el motor (**ENE-CP4**).

**Después:** el Cronograma —un módulo aparte del de Tareas, para actividades del
equipo que no son atención por WhatsApp—, la propuesta comercial automática
(congelada a propósito hasta que la base esté pulida), y la migración a la API
oficial de WhatsApp (**CORE-F1**), que tiene trámites que no dependen de
nosotros.
