import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://voltac.com.co'),
  title: {
    default: "Voltac Systems | IA, Automatización y Software a Medida",
    template: "%s | Voltac Systems"
  },
  description: "Aceleramos tu negocio con Inteligencia Artificial, Agentes Cognitivos y Software Web/App a medida. Transforma tus operaciones con automatización B2B.",
  keywords: ["inteligencia artificial", "desarrollo web", "automatización b2b", "agentes de ventas", "iot", "desarrollo a medida", "colombia", "voltac systems"],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://voltac.com.co',
    siteName: 'Voltac Systems',
    images: [{ url: '/Voltac_enviroment.png', width: 1200, height: 630, alt: 'Voltac Systems' }],
  },
  twitter: { card: 'summary_large_image', site: '@voltacsystems' },
};

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
