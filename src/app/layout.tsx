import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SERVICES, CONTACT } from "@/content/services";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://voltac.com.co'),
  title: {
    default: "Voltac Systems | Más resultados, menos trabajo manual",
    template: "%s | Voltac Systems"
  },
  description: "Identificamos las tareas que le están costando horas a su organización y las convertimos en procesos que se hacen solos. Automatización, atención automática de clientes y software a la medida. Resultados en semanas.",
  keywords: [
    "automatizar tareas repetitivas empresa",
    "asistente que atiende whatsapp 24 horas",
    "software a la medida",
    "reducir trabajo manual oficina",
    "informes automáticos",
    "reportes a entidades de control",
    "inteligencia artificial para empresas",
    "colombia",
    "voltac systems",
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://voltac.com.co',
    siteName: 'Voltac Systems',
    images: [{ url: '/og-voltac.jpg', width: 1200, height: 630, alt: 'Voltac Systems - Mas resultados, menos trabajo manual' }],
  },
  twitter: { card: 'summary_large_image', site: '@voltacsystems' },
  alternates: { canonical: '/' },
  // Sin canonical, una misma pagina puede indexarse por varias URLs con
  // parametros y competir consigo misma. Los limites de snippet en -1 dejan que
  // buscadores y asistentes citen parrafos completos en vez de dos lineas.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
};

/**
 * Datos estructurados de la compania.
 *
 * Se declara como ProfessionalService (subtipo de LocalBusiness) ademas de
 * Organization: eso habilita el panel de negocio local en Google y le da a los
 * asistentes de IA los datos con los que responden a "quien hace esto en
 * Cartagena" - direccion, telefono, cobertura y horario.
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "name": "Voltac Systems",
  "legalName": "Voltac Systems S.A.S.",
  "taxID": "901.734.603",
  "url": "https://voltac.com.co",
  "logo": "https://voltac.com.co/Logo_fondo_oscuro.png",
  "description": "Compañía colombiana de tecnología. Identifica las tareas que consumen horas dentro de una organización y las convierte en procesos automáticos, con herramientas de inteligencia artificial y programas hechos a la medida.",
  "foundingDate": "2024",
  "foundingLocation": "Colombia",
  "areaServed": ["Colombia", "Latinoamérica"],
  "knowsLanguage": "es",
  "image": "https://voltac.com.co/og-voltac.jpg",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Urbanizacion Britania",
    "addressLocality": "Cartagena de Indias",
    "addressRegion": "Bolivar",
    "addressCountry": "CO",
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 10.391, "longitude": -75.4794 },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00",
    },
  ],
  "telephone": CONTACT.phone,
  "email": CONTACT.email,
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Portafolio de servicios 2026",
    "itemListElement": SERVICES.map((svc) => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": svc.title,
        "description": svc.description,
        "url": `https://voltac.com.co/servicios#${svc.slug}`,
      },
    })),
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "ventas",
    "email": CONTACT.email,
    "telephone": CONTACT.phone,
    "areaServed": "CO",
    "availableLanguage": "Spanish"
  },
  "sameAs": [
    "https://www.linkedin.com/company/voltac-systems",
    "https://github.com/CMejiaVergel"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Voltac Systems",
  "url": "https://voltac.com.co",
  "inLanguage": "es-CO",
  "publisher": { "@type": "Organization", "name": "Voltac Systems" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} antialiased h-full scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
