# Plataforma Voltac

Sitios públicos y panel de administración de **Voltac Systems S.A.S.**

Una empresa, dos frentes comerciales, un solo núcleo:

| | |
|---|---|
| **Voltac Systems** | Tecnología, automatización e IA · [voltac.com.co](https://voltac.com.co) |
| **Voltac Energy** | Energía solar fotovoltaica · [energy.voltac.com.co](https://energy.voltac.com.co) |

La compañía está constituida **una sola vez**. Lo que hay son dos marcas. Esa
distinción no es cosmética: manda en cómo se reparten los datos, los permisos y
hasta las bases de datos. Se explica en [Los datos](#los-datos).

---

## Índice

- [Arranque rápido](#arranque-rápido)
- [Arquitectura](#arquitectura)
- [Los datos](#los-datos)
- [Módulos del panel](#módulos-del-panel)
- [Roles y acceso](#roles-y-acceso)
- [El asistente de WhatsApp](#el-asistente-de-whatsapp)
- [Despliegue](#despliegue)
- [Guiones de mantenimiento](#guiones-de-mantenimiento)
- [Documentación](#documentación)
- [Lo que no hay que romper](#lo-que-no-hay-que-romper)

---

## Arranque rápido

Requiere Node 20 o superior.

```bash
npm install
```

Cada marca se levanta por separado, porque son dos aplicaciones Next distintas:

```bash
npm run dev:systems
npm run dev:energy
```

Las dos usan el 3000 por defecto, así que para tenerlas a la vez hay que darle
puerto a la segunda:

```bash
npm run dev:energy -- -p 3001
```

Para compilar las dos:

```bash
npm run build
npm run typecheck
```

En desarrollo las bases se crean solas en el directorio de trabajo la primera
vez que arranca cada app. En servidor viven en un directorio compartido que se
indica con `VOLTAC_DATA_DIR`.

---

## Arquitectura

Monorepo con espacios de trabajo de npm.

```
voltac/
├── apps/
│   ├── systems/          Sitio público + panel de Voltac Systems
│   └── energy/           Sitio público + panel de Voltac Energy
├── packages/
│   └── core/             Todo lo compartido: módulos, datos, sesión, permisos
├── scripts/              Respaldo, restauración, migraciones, utilidades
├── Guides/               Documentación de producto y backlogs
└── uploads/              Archivos subidos desde el panel
```

**Casi todo vive en `packages/core`.** Las dos aplicaciones son en buena medida
una carcasa: declaran su marca, montan sus rutas y delegan. Un módulo nuevo se
escribe una vez en el núcleo y las dos marcas lo tienen.

Lo que sí es propio de cada app: las páginas públicas —cada marca tiene su
identidad, sus servicios y sus textos— y los módulos exclusivos de una línea,
como Dimensionamiento en Energy.

### Cómo sabe cada app quién es

Cada aplicación declara su línea de negocio en el entorno:

```
VOLTAC_VERTICAL=systems     # o energy
```

Se resuelve una sola vez al arrancar y **falla ruidosamente** si el valor no es
válido. Arrancar con la vertical equivocada significaría mostrar los datos de la
otra marca, y eso tiene que romperse en el arranque, no descubrirse en
producción.

### Tecnologías

| | |
|---|---|
| Next.js 16 (App Router) · React 19 | Aplicaciones |
| Tailwind CSS 4 | Estilos |
| SQLite (`sqlite3` + `sqlite`) | Persistencia |
| Cookie firmada con HMAC (Web Crypto) | Sesión |
| Recharts | Gráficas |
| `@react-pdf/renderer`, ExcelJS | Documentos y exportaciones |
| Tesseract.js, `pdf2pic` | OCR de facturas |

Sin ORM y sin servidor de base de datos, y es deliberado: el volumen de una
empresa de este tamaño cabe de sobra en SQLite, y el respaldo es copiar un
archivo.

---

## Los datos

Cinco bases, y el reparto responde a una pregunta de negocio, no técnica:
**¿esto es de la empresa o es de la marca?**

```
$VOLTAC_DATA_DIR/
├── contabilidad.db        La empresa. Facturación, movimientos, terceros
├── sistema.db             La empresa. Usuarios del panel y auditoría
├── contenido.db           La empresa. Calendario editorial y campañas
├── systems/voltac.db      La marca. Prospectos, proyectos, noticias
└── energy/voltac.db       La marca. Ídem, sin mezclarse con la otra
```

**La contabilidad es de la empresa.** Voltac Systems S.A.S. está constituida una
vez y los contadores necesitan la facturación completa, venga del frente que
venga. Las tablas `acc_*` no se filtran por marca.

**Los prospectos y el contenido son de la marca.** Un lead de energía solar no
tiene por qué aparecer en el panel de Systems, ni una noticia de una marca
publicarse en el sitio de la otra.

**La identidad va aparte de la contabilidad** aunque las dos sean comunes. El
guion de restauración devuelve la contabilidad a un punto anterior cuando algo
sale mal; arrastrar en esa vuelta atrás las cuentas de usuario y el registro de
quién hizo qué sería perder justo lo que hace falta para entender el incidente.

**El filtro por marca se aplica en la capa de acceso a datos, no en la
interfaz.** Así un descuido al pintar una tabla no puede mezclar marcas.

### Tablas principales

| Base | Tablas |
|---|---|
| `<marca>/voltac.db` | `quotes` (prospectos), `notes`, `projects`, `news_entries`, `analytics_events`, `estudios_dimensionamiento`, `api_keys` |
| `contabilidad.db` | `acc_accounts`, `acc_clients`, `acc_suppliers`, `acc_transactions`, `acc_invoices`, `acc_invoice_items`, `acc_quotes`, `acc_quote_items`, `acc_payments`, `acc_calendar_events`, `acc_webhook_logs` |
| `sistema.db` | `usuarios`, `auditoria` |
| `contenido.db` | `actividades` |

El esquema se crea y se migra solo al arrancar, en `packages/core/src/db.ts`.
No hay migraciones versionadas: las columnas nuevas se añaden con `ALTER TABLE`
condicionales en ese mismo archivo.

---

## Módulos del panel

Todos cuelgan de `/admin`. Los que dicen **Core** existen en las dos marcas con
los mismos componentes y datos separados.

### Dashboard · Core
`/admin` — Tablero general de la marca: prospectos, actividad reciente, estado
del negocio.

### Leads (CRM) · Core
`/admin/leads` — Los prospectos de la marca. Ficha, notas, estado de gestión, y
el botón que le pide al asistente un borrador de primer contacto para revisarlo
antes de que salga.

`quotes` es la tabla de prospectos pese al nombre: viene de cuando el formulario
público se llamaba "cotizar". El nombre se conservó para no migrar datos vivos.

### IA Assistant · Core
`/admin/ia-assistant` — La consola del asistente de WhatsApp. Cinco pestañas:

| | |
|---|---|
| **Panel** | Métricas de conversaciones y consumo |
| **Conversaciones** | Bandeja completa. Se puede tomar una conversación a mano; el asistente se calla en ese chat hasta que se la devuelvan |
| **Calendario** | Citas agendadas y **solicitudes** de cambio pendientes de aprobación |
| **Configuración** | Modelo, tono, vinculación de la línea de WhatsApp por QR, conexión con Google |
| **Actividad** | Auditoría de lo que hizo el asistente |

La configuración está reservada al propietario: quien atiende conversaciones no
cambia el modelo ni el tono con que habla la empresa.

### Dimensionamiento · Solo Energy
`/admin/dimensionamiento` — Calculadora fotovoltaica. A partir del consumo y la
tarifa estima potencia, número de paneles, área, inversión, ahorro, retorno,
impacto ambiental e incentivos tributarios, y devuelve además una **calificación
del prospecto** con recomendación de si conviene ofrecer reunión.

Es el mismo motor que usa el asistente de WhatsApp, expuesto en
`/api/dimensionamiento`. Que sea uno solo es intencional: si el chat y el panel
dieran cifras distintas, el asesor empezaría la reunión pidiendo disculpas.

Los estudios se guardan con **una copia de los precios del momento**, para que
una cotización enviada no cambie sola cuando se actualice la lista de precios.

- `motor.ts` — el cálculo
- `datos.ts` — precios de referencia, radiación por región, factores
- `calificacion.ts` — puntuación del prospecto
- `recibo.ts` — lectura de datos de factura

### Accounting · Core
`/admin/accounting` — El módulo más grande. Datos comunes a la empresa.

Dashboard, facturación, ingresos y egresos, clientes y proveedores,
cotizaciones, reportes y calendario tributario.

Incluye un **lector de facturas** (`invoice-parser`) que extrae los datos de un
PDF en cascada: primero texto embebido, si no hay texto pasa a OCR con Tesseract,
y si el resultado no valida recurre a un modelo de IA. Trae un analizador
específico para facturas de Siigo y uno genérico.

### Contenido · Core
`/admin/contenido` — Calendario editorial: planificación de publicaciones y
campañas. Datos comunes.

Es la base de la **máquina de contenido** que está en el backlog: hoy planifica,
el objetivo es que genere, mida y se ajuste solo.

### Noticias · Core
`/admin/news` — Blog de cada marca, con subida de imágenes.

### Proyectos · Core
`/admin/proyectos` — Portafolio de proyectos que se publica en el sitio.

### Analytics · Core
`/admin/analytics` — Analítica propia del sitio, sin terceros: un `Tracker` en
el sitio público escribe eventos en `analytics_events` y el panel los consulta.

Está señalado para reinventarse hacia métricas de redes sociales y campañas.
Ver los backlogs.

### Preview · Core
`/admin/preview` — Vista del sitio público desde dentro del panel.

### Usuarios · Solo propietario
`/admin/usuarios` — Cuentas del panel, con rol y marca. Tabla común a las dos
aplicaciones.

### Configuración · Solo propietario
`/admin/configuracion` — Credenciales y ajustes de la empresa.

---

## Roles y acceso

Cinco roles, y nacen de quién trabaja de verdad sobre la plataforma:

| Rol | Alcance |
|---|---|
| **propietario** | Todo, en las dos marcas |
| **contador** | Contabilidad y calendario tributario. No ve el CRM |
| **moderador** | Contenido, noticias, proyectos, analytics, preview. No ve dinero ni datos personales de prospectos |
| **asesor** | CRM y asistente: conversaciones, calendario, panel. No ve contabilidad ni cambia el comportamiento del asistente |
| **operador** | Asesor con tablero y dimensionamiento. Lleva la operación de una línea |

Son cinco y no un sistema de permisos por casilla, a propósito. Un panel de esta
escala con permisos granulares se convierte en una pantalla de configuración que
nadie mantiene y que acaba concediendo de más por comodidad. Cinco roles se
auditan leyendo una lista.

### La marca es otra dimensión

El rol dice **qué** puede hacer alguien; la marca dice **dónde**.

```
ambas | systems | energy
```

La tabla de usuarios es una sola y las dos aplicaciones la comparten. Sin este
campo, una cuenta creada para Energy entraría igual al panel de Systems y vería
su embudo comercial completo.

### Cómo se aplica

`packages/core/src/roles.ts` tiene la tabla de acceso —qué prefijo de ruta
alcanza qué rol— y `proxy.ts` es el portero único de las dos aplicaciones.

Estuvo duplicado, uno por app, y esa duplicación costó dos incidentes el mismo
día: al montar contabilidad en Energy, sus rutas quedaron respondiendo sin
sesión porque la lista de prefijos protegidos de esa app no se había
actualizado. Con una sola implementación, proteger algo nuevo se hace una vez.

**Lo que no le corresponde a alguien responde 404, no 403.** Un 403 confirma que
el módulo existe; un 404 no dice nada.

La sesión es una cookie httpOnly firmada con HMAC en el servidor. El estado de
la cuenta se comprueba **en cada petición protegida**, así que desactivar a
alguien surte efecto en el acto. Las páginas públicas no tocan la base.

---

## El asistente de WhatsApp

Vive en un repositorio aparte:
[voltac-asistente-whatsapp](https://github.com/CMejiaVergel/voltac-asistente-whatsapp).

Es un servicio Node independiente que atiende WhatsApp con un modelo de lenguaje
y **le habla a esta plataforma por HTTP**. Un proceso por marca, sobre la misma
copia del código, separados por perfil de entorno.

### Qué hace

Responde a prospectos, consulta la base de conocimiento de su línea, agenda
citas en Google Calendar, envía el portafolio por chat o por correo, transcribe
notas de voz en el servidor con whisper.cpp, y en Energy **lee la foto del
recibo de energía** con un modelo de visión y la pasa por el dimensionamiento.

Lo que **no** hace: mover o cancelar citas. Puede crearlas, pero un cambio sobre
una cita existente se radica como solicitud y la aprueba una persona desde la
pestaña Calendario. La asimetría es deliberada: crear una cita de más deja un
hueco en la agenda; cancelarla por error destruye un compromiso con un cliente y
nadie se entera hasta que alguien no aparece.

### Cómo se conectan

El asistente llama a esta plataforma con una clave Bearer de la tabla
`api_keys` de la marca correspondiente:

| Endpoint | Para qué |
|---|---|
| `POST /api/dimensionamiento` | Calcular el sistema y calificar al prospecto |
| `/api/leads` | Devolver el estado de la conversación al CRM |

En sentido contrario, el panel consulta al asistente en su puerto de loopback
para pintar conversaciones, métricas, calendario y solicitudes.

**Las claves son por marca.** Una clave de Energy no sirve contra la base de
Systems, y es lo que impide que un error de configuración cruce los datos.

---

## Despliegue

VPS con Nginx delante y PM2 gestionando los procesos.

| Proceso | Qué es | Puerto |
|---|---|---|
| `voltac-energy` | Sitio y panel de Energy | 3000 |
| `voltac-systems` | Sitio y panel de Systems | 3001 |
| `voltac-asistente` | Asistente de Systems | 3020 (loopback) |
| `voltac-asistente-energy` | Asistente de Energy | 3021 (loopback) |

> Los puertos de los sitios van al revés de lo que uno esperaría: **Energy en el
> 3000 y Systems en el 3001**. Ya provocó un fallo —`CRM_BASE_URL` del asistente
> de Energy apuntaba al 3001 y el dimensionamiento devolvía 404— así que
> conviene tenerlo presente.

Los asistentes escuchan **solo en loopback** y no se exponen por Nginx.

### Desplegar la plataforma

```bash
cd /var/www/voltac-systems
git pull && npm ci && npm run build
pm2 restart voltac-systems voltac-energy
```

### Desplegar el asistente

Desde su propio directorio, con el guion que hace los cuatro pasos en orden:

```bash
cd /var/www/voltac-asistente && npm run desplegar
```

Ese guion existe porque el despliegue manual olvidaba el `build`: PM2 arranca
`dist/`, así que un `git pull` seguido de `restart` reinicia el binario viejo y
todo parece desplegado sin estarlo.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `VOLTAC_VERTICAL` | `systems` o `energy`. Obligatoria |
| `VOLTAC_DATA_DIR` | Directorio compartido de las bases. En servidor, fuera del repo |
| `ADMIN_USERNAME` | Usuario de acceso al panel |
| `ADMIN_PASSWORD_HASH` | Hash de la contraseña. Nunca la contraseña en claro |
| `ADMIN_SESSION_SECRET` | Clave con la que se firma la cookie de sesión |

Van en un `.env` por aplicación, que **no se versiona**.

---

## Guiones de mantenimiento

```bash
scripts/backup.sh                  Respaldo de las bases
scripts/restore.sh                 Restauración a un punto anterior
scripts/crear-clave-api.mjs        Clave de API para una marca
scripts/probar-acceso.mjs          Verifica la tabla de permisos por ruta
scripts/migrar-datos.mjs           Migración de datos entre esquemas
scripts/importar-analytics.mjs     Carga histórica de analítica
scripts/md-a-pdf.py                Regenera los PDF de los backlogs
```

Crear una clave de API necesita la marca y el directorio de datos:

```bash
VOLTAC_DATA_DIR=/var/www/voltac-data \
  node scripts/crear-clave-api.mjs energy "Asistente WhatsApp"
```

**La clave se imprime una sola vez.** No hay forma de recuperarla; si se pierde,
se crea otra.

---

## Documentación

En `Guides/`:

| | |
|---|---|
| `Backlog_Systems.md` · `.pdf` | Pendientes de la suite de Systems |
| `Backlog_Energy.md` · `.pdf` | Pendientes de la suite de Energy |
| `PRD_Accounting_Module.md` | Diseño del módulo de contabilidad |
| `deploy_vps_voltac.md` | Detalle del despliegue |
| `seo_llm_strategy_prd.md` | Estrategia de posicionamiento |
| `search_console_setup.md` | Configuración de Search Console |

Los dos backlogs marcan cada ítem como **CORE** —se construye una vez y se
configura por suite— o propio de una línea. Los ítems CORE aparecen en los dos
archivos con el mismo identificador; **si cambia uno, cámbielo en los dos**.

Del asistente, en su repositorio: `docs/00-arquitectura.md`,
`01-whatsapp-canales.md`, `02-bloques.md`, `04-historial-tecnico.md`,
`05-despliegue.md` y `06-leads.md`.

---

## Lo que no hay que romper

**El filtro por marca va en la capa de datos.** Nunca en la interfaz. Si un
listado se pinta sin filtrar, mezcla marcas y nadie lo nota hasta que un
prospecto de una línea aparece en el panel de la otra.

**Proteger una ruta nueva es añadirla a `ACCESO` en `roles.ts`.** La regla más
corta, `/admin`, recoge todo lo que no esté listado: conceder un rol ahí concede
de más si algo se olvida.

**La contabilidad no se filtra por vertical.** Es la excepción, y es a propósito.

**Los módulos compartidos van en `packages/core`.** Duplicar un componente entre
las dos apps es cómodo el primer día y caro el resto. Ya pasó: el campo "Tipo"
del CRM de Systems ofrece las categorías fotovoltaicas de Energy porque el modal
está copiado en vez de compartido.

**Nunca se sube al repositorio:** archivos `.env`, las bases `*.db`, el
directorio `uploads/`, ni ninguna clave de API.

---

Voltac Systems S.A.S. · NIT 901.734.603
