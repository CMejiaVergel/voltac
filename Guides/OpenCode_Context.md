# Contexto de Proyecto: Voltac Systems

**Fecha de Actualización**: Mayo 2026
**Propósito**: Contextualizar a OpenCode (y futuros desarrolladores) sobre la arquitectura, herramientas y el estado actual de la plataforma web de Voltac Systems.

---

## 1. Visión General del Sistema
La plataforma web de Voltac Systems es una aplicación *Full-Stack* construida sobre **Next.js 16 (App Router)**. No solo funciona como un *landing page* corporativo para atraer prospectos (SEO + LLM optimizations), sino que incorpora un complejo **Módulo Administrativo (Admin Panel)** con funciones de CRM básico y un robusto sistema de Facturación y Contabilidad.

### Stack Tecnológico
- **Core**: Next.js 16.2.6, React 19, TypeScript
- **Estilos**: Tailwind CSS v4, Framer Motion (micro-interacciones)
- **Base de Datos**: SQLite (almacenado localmente en `voltac.db`) a través del paquete `sqlite` y `sqlite3`.
- **Formularios & Validación**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **Iconos**: `lucide-react`, `react-icons`
- **Generación PDF**: `@react-pdf/renderer` (Generación de Cotizaciones y Facturas al vuelo)
- **Editor de Texto Enriquecido**: Tiptap (para módulo de noticias/blog)
- **Gráficos y Dashboards**: `recharts`, `lightweight-charts`
- **Utilidades de Exportación**: `exceljs` para reportes en Excel.
- **Herramientas de Extracción (OCR)**: `pdf-parse` v1.1.1, `tesseract.js`, `pdf2pic` (Para extracción de datos de PDFs)

---

## 2. Arquitectura de Directorios

El código reside principalmente en el directorio `src/`.

```text
c:\Users\mejia\Desktop\VOLTAC_SYSTEMS\VOLTAC\Website\
├── .npmrc                   # Configuraciones de npm (ej. overrides de dependencias de seguridad)
├── next.config.ts           # Configuración de Next.js (serverExternalPackages clave para Turbopack)
├── package.json             # Manejo de dependencias
├── voltac.db                # Base de datos SQLite local
├── Guides/                  # Documentación técnica, PRDs, estrategias SEO, despliegue
├── public/                  # Assets estáticos (imágenes, fuentes, iconos)
└── src/
    ├── app/                 # Next.js App Router (Páginas y APIs)
    │   ├── admin/           # Panel Administrativo (Protegido/Dashboard)
    │   ├── api/             # Backend API Routes
    │   └── (públicas)       # Páginas web públicas (servicios, proyectos, noticias, contacto)
    ├── components/          # Componentes reusables de React (UI y Gráficos)
    ├── lib/                 # Utilidades (db.ts, generadores PDF, helpers)
    └── services/            # Lógica de negocio pesada (ej. invoice-parser)
```

---

## 3. Base de Datos (Schema)
El proyecto utiliza una base de datos SQLite integrada. La conexión y las migraciones iniciales se manejan en `src/lib/db.ts` utilizando la función `getDB()`.

**Tablas Principales:**
1. **CRM / Web Leads**:
   - `quotes`: Solicitudes entrantes desde la web (CRM inicial).
   - `notes`: Notas internas para los leads.
   - `projects` / `news_entries`: Gestor de contenido.
2. **Módulo Accounting (Contabilidad y Facturación)**:
   - `acc_clients` y `acc_suppliers`: Catálogo de terceros.
   - `acc_accounts`: Plan de cuentas contable (Ingresos, Egresos, Activos).
   - `acc_transactions`: Flujo de caja (ingresos y egresos).
   - `acc_invoices` y `acc_invoice_items`: Facturas emitidas y recibidas (incluye impuestos y descuentos).
   - `acc_quotes` y `acc_quote_items`: Cotizaciones formales generadas desde el sistema.
   - `acc_payments`: Registro de pagos abonados a las facturas.
   - `acc_calendar_events`: Eventos de calendario (reuniones, fechas límite, etc.).

> **Manejo de borrado**: El sistema emplea **Soft Deletes** (`is_active = 0` o `status = 'Anulada'`) para evitar pérdida de datos transaccionales.

---

## 4. Módulo "Accounting" (Facturación y Contabilidad)
Este módulo es el núcleo operacional del Admin Panel (`/admin/accounting`).

### Funcionalidades Frontend:
- **Dashboard (`/admin/accounting/dashboard`)**: Métricas en tiempo real, suma de ingresos/egresos, facturación cobrada/pendiente. Usa `recharts`.
- **Cotizaciones (`/admin/accounting/cotizaciones`)**: Permite crear cotizaciones, verlas en vista Kanban, y convertirlas directamente en facturas.
- **Facturación (`/admin/accounting/facturacion`)**: Gestión de facturas Emitidas y Recibidas. Permite registrar pagos parciales/totales.
- **Transacciones (`/admin/accounting/ingresos-egresos`)**: Registro de caja.
- **Terceros (`/admin/accounting/clientes-proveedores`)**: CRUD de clientes y proveedores. Los modales de facturación permiten la "creación inline" de terceros sin perder el progreso.

### Funcionalidades Avanzadas de Backend (`src/app/api/accounting/`):
- **Generación de PDF (`[id]/pdf/route.ts`)**: Los PDFs se generan *del lado del servidor* (SSR) usando `@react-pdf/renderer` para cotizaciones y facturas, con branding oficial.
- **Exportación Excel (`/export/route.ts`)**: Descarga directa de datos formateados usando `exceljs`.
- **Transacciones SQL**: Las inserciones complejas (factura + ítems) están envueltas en `BEGIN/COMMIT/ROLLBACK` para evitar inconsistencias y errores `500`.

---

## 5. El "Auto-Parser" de Facturas (Hito Crítico)
Recientemente implementamos un motor híbrido de extracción de datos de PDFs para evitar la digitación manual de facturas, especialmente desde plataformas como **Siigo**.

**Ubicación**: `src/services/invoice-parser/`

**Arquitectura del Parser:**
1. **Extracción Directa (Paso 1)**: Usa `pdf-parse@1.1.1` (sin dependencias problemáticas de navegador) para extraer texto plano del PDF. Funciona perfecto para PDFs nativos exportados desde el navegador (ej. iSiigo).
2. **OCR Fallback (Paso 1B)**: Si el PDF es un archivo escaneado, se utiliza `pdf2pic` y `tesseract.js` para extraer el texto de las imágenes (DPI alto, Worker en español).
3. **Parseo con Expresiones Regulares (Paso 2)**:
   - `siigo-parser.ts`: Expresiones altamente ajustadas para atrapar líneas del formato Siigo ("Señores", ítems multi-línea, NITs).
   - `generic-parser.ts`: Reglas flexibles para facturas de otros proveedores.
4. **Validación (Paso 3)**: Evalúa que existan campos críticos y suma cruzada (Subtotal + IVA == Total).
5. **Fallback de IA (Opcional - n8n/OpenRouter)**: Si la validación falla (ej. faltan datos), envía un request al Webhook de n8n para resolver la estructura faltante usando un LLM como Gemini/Claude.

La UI de facturación (`FacturacionPage`) incluye un "PDF Preview Card" que resalta si la extracción fue exitosa o si hay advertencias matemáticas.

---

## 6. Consideraciones para el Despliegue en VPS
1. **Next.js Turbopack & Dependencias Nativas**:
   Archivos pesados del backend (`sharp`, `pdf-parse`, `tesseract.js`, `sqlite3`, `canvas`) **están excluidos** del empaquetador en `next.config.ts` mediante `serverExternalPackages`. De no hacerlo, `npm run build` falla o causa errores 500 en producción.
2. **Requisitos de Sistema (OCR)**:
   Debido al uso de `pdf2pic`, el servidor Ubuntu/Debian donde se aloja el VPS **debe tener instalado Ghostscript y GraphicsMagick**:
   ```bash
   sudo apt-get install ghostscript graphicsmagick
   ```
3. **Persistencia de Base de Datos**:
   El archivo `voltac.db` y el directorio `uploads/` están ignorados en Git (`.gitignore`).
4. **Seguridad (Overrides)**:
   Se usa npm overrides en `package.json` para parchar vulnerabilidades profundas de la cadena de suministro (ej. `postcss`).
5. **Comandos de Actualización**:
   ```bash
   git pull origin main
   npm ci
   npm run build
   pm2 restart voltac-systems
   ```

## 7. Áreas para Trabajo Futuro de OpenCode
- Refinar los patrones RegEx en `siigo-parser.ts` en caso de que Siigo altere su plantilla de exportación.
- Implementar sanitización de parámetros SQL en `/api/accounting/export/route.ts` para mitigar cualquier riesgo residual de inyección (actualmente se confía en la UI, pero el parámetro `type` es interpolado crudo).
- Mejoras de UI/UX en las pantallas del CRUD.
- Seguir avanzando en las optimizaciones SEO orientadas a LLM y Server Components en el frontend público de Voltac Systems.
