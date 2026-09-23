import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsTracker } from "@voltac/core/analytics/Tracker";
import { SERVICES, CONTACT } from "@/content/services";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(CONTACT.site),
  title: {
    default: "Voltac Industry | Mantenimiento, control e instrumentación",
    template: "%s | Voltac Industry"
  },
  description: "Mantenimiento industrial, control automático de procesos e instrumentación en Cartagena y la Costa Caribe. Calibración con certificado trazable, mantenimiento predictivo, tableros eléctricos, calidad de energía y paradas de planta.",
  keywords: [
    "mantenimiento industrial cartagena",
    "instrumentación y calibración de instrumentos",
    "control automático de procesos plc dcs",
    "mantenimiento predictivo termografía vibraciones",
    "tableros eléctricos baja y media tensión",
    "estudio de calidad de energía",
    "paradas de planta montaje electromecánico",
    "colombia",
    "voltac industry",
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: CONTACT.site,
    siteName: 'Voltac Industry',
    images: [{ url: '/og-industry.jpg', width: 1200, height: 630, alt: 'Voltac Industry - Mantenimiento, control e instrumentacion' }],
  },
  twitter: { card: 'summary_large_image' },
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
  "name": "Voltac Industry",
  "legalName": CONTACT.legalName,
  "taxID": CONTACT.nit,
  "url": CONTACT.site,
  "logo": `${CONTACT.site}/Logo_fondo_oscuro.png`,
  "description": "Línea de mantenimiento industrial, control e instrumentación de Voltac Systems S.A.S. Calibración trazable, sintonía de lazos, supervisión SCADA, mantenimiento predictivo, tableros eléctricos, calidad de energía y paradas de planta.",
  "foundingDate": "2024",
  "foundingLocation": "Colombia",
  "areaServed": ["Colombia"],
  "knowsLanguage": "es",
  "image": `${CONTACT.site}/og-industry.jpg`,
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
    "name": "Portafolio de servicios industriales 2026",
    "itemListElement": SERVICES.map((svc) => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": svc.title,
        "description": svc.description,
        "url": `${CONTACT.site}/servicios#${svc.slug}`,
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
  "sameAs": ["https://www.linkedin.com/company/voltac-systems"]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Voltac Industry",
  "url": CONTACT.site,
  "inLanguage": "es-CO",
  "publisher": { "@type": "Organization", "name": CONTACT.legalName },
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
        <AnalyticsTracker />
      </body>
    </html>
  );
}
