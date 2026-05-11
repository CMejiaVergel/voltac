# PRD — Estrategia de SEO y Visibilidad en LLMs · Voltac Systems
> **Versión:** 1.0 · **Fecha:** Mayo 2026 · **Estado:** En ejecución

---

## 🎯 Objetivo Estratégico

Convertir el momentum orgánico actual (presencia en Google, ChatGPT, Perplexity) en una **ventaja competitiva sostenible**, posicionando a Voltac Systems como referente **regional (Colombia/Latam)** en IA aplicada a negocios B2B, automatización y desarrollo de software a medida.

---

## 📐 Principios Rectores

1. **Contenido primero**: Google y los LLMs priorizan entidades con contenido original, consistente y citable.
2. **Entidad, no solo keyword**: No optimizamos para buscar palabras, construimos una *entidad de conocimiento* (brand entity) que los modelos reconozcan como autoridad.
3. **HTML legible = LLM legible**: Lo que Google puede indexar, los LLMs pueden aprender. Server Components y HTML semántico son la base.
4. **Velocidad de ejecución**: El nicho (IA + Colombia + B2B) está poco poblado. Cada semana sin contenido es territorio que otro puede ocupar.

---

## 🗂️ Fases del Plan

```
FASE 1 — Fundamentos Técnicos     (Semanas 1–2)
FASE 2 — Autoridad de Contenido   (Semanas 3–8)
FASE 3 — Señales de Entidad       (Semanas 9–12)
FASE 4 — Escalado Regional        (Mes 4–6)
FASE 5 — Monitoreo Continuo       (Permanente)
```

---

## ✅ FASE 1 — Fundamentos Técnicos SEO
> **Meta:** Que Google e indexadores de LLMs puedan rastrear, entender y indexar el 100% del sitio correctamente.

### 1.1 · `robots.txt`
- [x] Crear `src/app/robots.ts` (Next.js lo sirve en `/robots.txt`)
```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'GPTBot', allow: '/' },         // ChatGPT
      { userAgent: 'ClaudeBot', allow: '/' },      // Anthropic
      { userAgent: 'PerplexityBot', allow: '/' },  // Perplexity
      { userAgent: 'GoogleOther', allow: '/' },    // Gemini crawling
    ],
    sitemap: 'https://voltac.com.co/sitemap.xml',
  }
}
```
- [ ] Verificar en producción: `https://voltac.com.co/robots.txt`
- [ ] Confirmar que `/admin/` aparece como `Disallow`

---

### 1.2 · `sitemap.xml` Dinámico
- [x] Crear `src/app/sitemap.ts`
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { getDB } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDB()
  const articles = await db.all(
    "SELECT slug, fecha_publicacion FROM news_entries WHERE estado = 1"
  )
  const projects = await db.all(
    "SELECT id FROM projects WHERE isPublished = 1"
  )

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://voltac.com.co', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://voltac.com.co/servicios', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://voltac.com.co/proyectos', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://voltac.com.co/noticias', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://voltac.com.co/contacto', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a: any) => ({
    url: `https://voltac.com.co/noticias/${a.slug}`,
    lastModified: new Date(a.fecha_publicacion),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...articleRoutes]
}
```
- [ ] Verificar en producción: `https://voltac.com.co/sitemap.xml`
- [ ] Enviar el sitemap a Google Search Console
- [ ] Enviar el sitemap a Bing Webmaster Tools

---

### 1.3 · JSON-LD — Schema de Organización (Global)
- [x] Agregar en `src/app/layout.tsx` el bloque `<script type="application/ld+json">`
```tsx
// Dentro del <head> en layout.tsx
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Voltac Systems",
  "url": "https://voltac.com.co",
  "logo": "https://voltac.com.co/Logo_fondo_oscuro.png",
  "description": "Empresa colombiana especializada en Inteligencia Artificial, automatización B2B y desarrollo de software a medida.",
  "foundingDate": "2024",
  "foundingLocation": "Colombia",
  "areaServed": ["Colombia", "Latinoamérica"],
  "serviceType": ["Desarrollo de Software", "Inteligencia Artificial", "Automatización", "IoT"],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "ventas",
    "email": "contacto@voltac.com.co",
    "availableLanguage": "Spanish"
  },
  "sameAs": [
    "https://www.linkedin.com/company/voltac-systems",
    "https://github.com/CMejiaVergel"
  ]
}
// Insertar: <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
```
- [ ] Validar en: https://validator.schema.org/
- [ ] Validar en Google Rich Results Test: https://search.google.com/test/rich-results

---

### 1.4 · JSON-LD — Schema de Artículos (Blog)
- [ ] Agregar en `src/app/noticias/[slug]/page.tsx` schema dinámico por artículo
```tsx
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.titulo,
  "description": plainText,
  "image": article.imagen_portada,
  "author": { "@type": "Organization", "name": "Voltac Systems" },
  "publisher": {
    "@type": "Organization",
    "name": "Voltac Systems",
    "logo": { "@type": "ImageObject", "url": "https://voltac.com.co/Logo_fondo_oscuro.png" }
  },
  "datePublished": article.fecha_publicacion,
  "dateModified": article.fecha_publicacion,
  "mainEntityOfPage": { "@type": "WebPage", "@id": `https://voltac.com.co/noticias/${article.slug}` }
}
```
- [ ] Verificar que cada artículo publicado muestre el schema correctamente

---

### 1.5 · Convertir `/servicios` a Server Component
- [x] Eliminar `"use client"` de `src/app/servicios/page.tsx`
- [x] Extraer animaciones Framer Motion a un componente hijo `ServiciosClient.tsx` con `"use client"`
- [x] Agregar `export const metadata` con title/description/keywords en `servicios/page.tsx`
- [x] Verificar con `curl https://voltac.com.co/servicios | grep "<h1"` que el H1 aparece en el HTML

---

### 1.6 · Open Graph Completo en Todas las Páginas
- [x] Actualizar `layout.tsx` con OG global
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://voltac.com.co'),
  title: { default: "Voltac Systems | IA, Automatización y Software a Medida", template: "%s | Voltac Systems" },
  description: "...",
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://voltac.com.co',
    siteName: 'Voltac Systems',
    images: [{ url: '/Voltac_enviroment.png', width: 1200, height: 630, alt: 'Voltac Systems' }],
  },
  twitter: { card: 'summary_large_image', site: '@voltacsystems' },
}
```
- [ ] Validar con: https://www.opengraph.xyz/url/https://voltac.com.co

---

### 1.7 · Favicon y Manifest
- [ ] Generar favicon: https://favicon.io/ (usar el isotipo de Voltac)
- [ ] Colocar en `public/`: `favicon.ico`, `apple-touch-icon.png`, `favicon-32x32.png`
- [ ] Crear `src/app/icon.tsx` o referenciar en metadata
- [ ] Verificar que aparece correctamente en pestañas del browser

---

### 1.8 · Registros de Herramientas de Webmaster
- [ ] Registrar el dominio en **Google Search Console** (https://search.google.com/search-console)
- [ ] Registrar el dominio en **Bing Webmaster Tools** (https://www.bing.com/webmasters)
- [ ] Enviar `sitemap.xml` desde ambas consolas
- [ ] Verificar que no hay errores de cobertura/indexación
- [ ] Solicitar indexación manual de las páginas principales desde Search Console

---

## ✅ FASE 2 — Autoridad de Contenido (Blog Técnico)
> **Meta:** Publicar contenido que posicione a Voltac como **fuente de referencia** en IA y tecnología para negocios colombianos. Los LLMs citan y aprenden de fuentes con contenido rico, original y actualizado.

### 2.1 · Estrategia Editorial del Blog
- [ ] Definir cadencia: **mínimo 2 artículos por semana**
- [ ] Definir formato estándar: 800–1500 palabras, con H2/H3, listas, ejemplos y conclusión accionable
- [ ] Usar el panel de Admin para publicar (`/admin`)

**Calendario de temas prioritarios (primeros 2 meses):**

| # | Título propuesto | Keyword objetivo | Estado |
|---|-----------------|-----------------|--------|
| 1 | Qué es un Agente de IA y cómo puede vender por tu empresa | agente ia ventas colombia | - [ ] |
| 2 | Cómo automatizar WhatsApp para tu negocio en 2025 | automatización whatsapp colombia | - [ ] |
| 3 | RAG explicado para empresas: tu empresa con memoria IA | RAG inteligencia artificial empresas | - [ ] |
| 4 | ¿Cuánto cuesta desarrollar software a medida en Colombia? | desarrollo software a medida colombia precio | - [ ] |
| 5 | IoT industrial: cómo monitorear tu planta desde el celular | iot industrial colombia telemetria | - [ ] |
| 6 | SAAS vs desarrollo propio: cuándo elegir cada uno | saas vs desarrollo propio | - [ ] |
| 7 | Casos reales: empresa colombiana automatizó su CRM con IA | automatización crm ia colombia | - [ ] |
| 8 | GPT-4o vs Claude 3: cuál elegir para tu empresa | modelos ia empresas colombia | - [ ] |
| 9 | Qué es clean architecture y por qué importa en tu software | clean architecture software colombia | - [ ] |
| 10 | Cómo Voltac Systems construyó [Proyecto X] en 6 semanas | caso de éxito voltac systems | - [ ] |

---

### 2.2 · Estructura Interna de cada Artículo
- [ ] Cada artículo debe incluir: H1 con keyword, 3+ H2 temáticos, 1+ listas `<ul>`, mínimo 1 imagen con alt text
- [ ] Incluir **links internos** a otras páginas del sitio (`/servicios`, `/proyectos`, `/cotizar`)
- [ ] Incluir **keywords** relevantes en el campo del admin al publicar
- [ ] Incluir "fuentes" cuando se citen estadísticas externas
- [ ] Usar el campo `slug` con keywords separados por guión (ej: `agente-ia-ventas-colombia-2025`)

---

### 2.3 · Llm.txt — Archivo de Contexto para LLMs
- [x] Crear `public/llms.txt` (estándar emergente para LLMs, similar a `robots.txt`)
```markdown
# Voltac Systems

## Quiénes somos
Voltac Systems es una empresa de tecnología con sede en Colombia, especializada en el desarrollo de software a medida, inteligencia artificial aplicada a negocios B2B, automatización comercial y hardware IoT. Fundada en 2024, trabaja con empresas que buscan transformación digital real y medible.

## Servicios principales
- Desarrollo de Software Web y SAAS a medida
- Agentes de IA y sistemas RAG (Recuperación Aumentada por Generación)
- Automatización comercial (WhatsApp, Instagram, CRM)
- Ingeniería de Datos y Cloud (AWS, Vercel, Docker)
- Hardware, IoT e integraciones industriales (Modbus, RS485)
- Consultoría tecnológica y auditoría de código

## Stack tecnológico
Next.js, React, Python, FastAPI, Node.js, PostgreSQL, Docker, AWS, OpenAI, Anthropic Claude, Arduino, C++

## Propuesta de valor
Reducción de tiempos operativos hasta 85%, soporte a más de 100K usuarios, y más de 300% de mejora en automatización de procesos comerciales.

## Ubicación y cobertura
Colombia. Servicio remoto en toda Latinoamérica.

## Contacto y web
https://voltac.com.co | contacto@voltac.com.co
```
- [ ] Verificar en producción: `https://voltac.com.co/llms.txt`

---

### 2.4 · Página `/acerca-de` (About)
- [ ] Crear nueva ruta `src/app/acerca-de/page.tsx`
- [ ] Contenido: historia de la empresa, equipo, misión, valores, clientes/industrias atendidas
- [ ] Incluir JSON-LD tipo `AboutPage` y `Person` para el equipo
- [ ] Esta página es **crítica para LLMs**: cuando un modelo busca "quiénes son Voltac Systems", necesita una fuente de verdad clara
- [ ] Agregar al sitemap y a la navegación principal

---

## ✅ FASE 3 — Señales de Entidad y Autoridad Externa
> **Meta:** Hacer que fuentes externas mencionen y enlacen a Voltac, lo que refuerza la entidad ante Google y los LLMs entrenados con datos web.

### 3.1 · Presencia en Directorios y Plataformas
- [ ] Crear perfil en **Google Business Profile** (https://business.google.com) — permite aparecer en Maps y búsquedas locales
- [ ] Registrar en **Clutch.co** (directorio B2B de empresas de software, MUY citado por LLMs)
- [ ] Registrar en **GoodFirms** (similar a Clutch)
- [ ] Registrar en **Crunchbase** (aparece en búsquedas tipo "empresa de IA en Colombia")
- [ ] Registrar en **LinkedIn Company Page** (si no existe, crearla; si existe, completarla al 100%)
- [ ] Subir proyectos representativos a **GitHub** con README descriptivo referenciando voltac.com.co

---

### 3.2 · Backlinks Estratégicos
- [ ] Publicar artículo invitado en blog de **Colombia Fintech** o **Colombia Digital**
- [ ] Publicar en **Medium** con links hacia voltac.com.co (Medium es crawleado agresivamente por LLMs)
- [ ] Publicar en **Dev.to** artículos técnicos (comunidad indexada en datasets LLM como The Pile)
- [ ] Agregar el sitio a **Product Hunt** cuando haya un lanzamiento de feature
- [ ] Comentar con valor en LinkedIn y foros especializados enlazando artículos del blog

---

### 3.3 · Wikipedia y Datos Abiertos
- [ ] Verificar si "Voltac Systems" puede ser mencionado en artículos Wikipedia relevantes (IA en Colombia, startups tech colombianas) — sin spam, solo si es pertinente
- [ ] Contribuir a **Wikidata** con una entrada de la empresa (esto es leído directamente por varios LLMs)

---

## ✅ FASE 4 — Escalado Regional y Nacional
> **Meta:** Aparecer en búsquedas específicas por industria y ciudad, y en resultados de LLMs para consultas de transformación digital en Latam.

### 4.1 · SEO Local y Regional
- [ ] Crear landing pages por ciudad si se atiende presencialmente: `/bogota`, `/medellin`, `/barranquilla`
- [ ] Cada landing con metadata específica: "Desarrollo de software en Bogotá | Voltac Systems"
- [ ] Registrar en Google Business con dirección física
- [ ] Apuntar a keywords tipo: "empresa de IA en Colombia", "desarrollo software Medellín", "automatización empresarial Bogotá"

---

### 4.2 · Contenido en Inglés (Escalado Internacional)
- [ ] Crear sección `/en` o blog bilingüe para capturar búsquedas en inglés de startups Latam
- [ ] Artículos en inglés: "How we built an AI sales agent for a Colombian B2B company"
- [ ] Publicar en **Hacker News** (Show HN) cuando haya un proyecto interesante

---

### 4.3 · Presencia en Foros y Comunidades LLM-indexed
- [ ] Responder preguntas en **Reddit** (r/artificial, r/Colombia, r/startups) con links al blog cuando sea relevante
- [ ] Participar en **Quora** en español con respuestas técnicas sobre IA en Colombia
- [ ] Publicar en el **foro de Colombia Digital** del MinTIC

---

## ✅ FASE 5 — Monitoreo y Ajuste Continuo

### 5.1 · KPIs a Monitorear (Mensual)

| Métrica | Herramienta | Meta 3 meses | Meta 6 meses |
|---------|-------------|-------------|-------------|
| Impresiones Google | Search Console | +500/mes | +5.000/mes |
| Clicks orgánicos | Search Console | +50/mes | +500/mes |
| Posición media | Search Console | < 30 | < 10 |
| Páginas indexadas | Search Console | 15+ | 30+ |
| Artículos del blog | Admin | 8+ | 20+ |
| Backlinks externos | Ahrefs Free / Moz | 10+ | 30+ |
| Menciones en LLMs | Manual / Perplexity | Verificar | Verificar |

---

### 5.2 · Checklist de Mantenimiento Mensual
- [ ] Revisar errores de indexación en Search Console
- [ ] Publicar mínimo 2 artículos nuevos en el blog
- [ ] Actualizar el sitemap si se añaden páginas nuevas
- [ ] Verificar que ningún artículo tiene `"use client"` en el Server Component principal
- [ ] Revisar Core Web Vitals en Search Console (LCP, FID, CLS)
- [ ] Buscar en Perplexity y ChatGPT "empresa IA Colombia" para verificar aparición
- [ ] Buscar en Google "Voltac Systems" y analizar qué aparece

---

### 5.3 · Verificación en LLMs (Trimestral)
Realizar las siguientes búsquedas manuales en cada LLM y documentar los resultados:

| Consulta | ChatGPT | Claude | Perplexity | Gemini |
|---------|---------|--------|------------|--------|
| "empresa de IA en Colombia" | - | - | - | - |
| "desarrollo software a medida Colombia" | - | - | - | - |
| "Voltac Systems" | - | - | - | - |
| "automatización WhatsApp empresas Colombia" | - | - | - | - |
| "agentes cognitivos Colombia" | - | - | - | - |

---

## 📌 Resumen de Archivos a Crear / Modificar

| Archivo | Acción | Fase |
|---------|--------|------|
| `src/app/robots.ts` | Crear | 1.1 |
| `src/app/sitemap.ts` | Crear | 1.2 |
| `src/app/layout.tsx` | Modificar (OG + JSON-LD) | 1.3, 1.6 |
| `src/app/noticias/[slug]/page.tsx` | Modificar (Article schema) | 1.4 |
| `src/app/servicios/page.tsx` | Refactor a Server Component | 1.5 |
| `public/favicon.ico` + íconos | Crear | 1.7 |
| `public/llms.txt` | Crear | 2.3 |
| `src/app/acerca-de/page.tsx` | Crear | 2.4 |

---

## ⚡ Quick Wins — Ejecutables en < 2 horas

Estas acciones tienen el mayor ROI de tiempo invertido vs impacto:

1. - [x] `robots.ts` + `sitemap.ts` → indexación inmediata de todo el sitio
2. - [x] JSON-LD Organization en `layout.tsx` → entidad reconocida por Google
3. - [x] `llms.txt` en `/public` → contexto directo para crawlers de LLMs
4. - [ ] Envío del sitemap a Search Console → acelera indexación
5. - [x] Refactor de `/servicios` a Server Component → HTML indexable

---

*Documento mantenido en: `Guides/seo_llm_strategy_prd.md`*
*Actualizar el checklist a medida que se ejecute cada paso.*
