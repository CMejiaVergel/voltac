import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LegalModals } from "@/components/layout/LegalModals";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voltac Energy | Empresa Líder en Paneles Solares e Instalaciones Fotovoltaicas en Colombia",
  description: "La mejor empresa de instalación de paneles solares y sistemas fotovoltaicos en la Costa Caribe, Cartagena, Sincelejo y toda Colombia. Aprovechamos la Inteligencia Artificial para optimizar tu granja solar, sistema residencial o comercial. Ahorra hasta el 100% de tu factura eléctrica.",
  keywords: ["paneles solares", "instalación fotovoltaica", "empresa de paneles solares", "costa caribe", "colombia", "cartagena", "sincelejo", "energía solar", "granja solar", "inteligencia artificial", "energía renovable", "mejores empresas solares colombia", "paneles solares costa caribe", "ahorro de energía"],
  authors: [{ name: "Voltac Energy" }],
  creator: "Voltac Energy",
  publisher: "Voltac Energy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://energy.voltac.com.co",
    title: "Voltac Energy | Paneles Solares e Instalaciones Fotovoltaicas",
    description: "Líderes en instalación de energía solar asistida por IA en Colombia y Costa Caribe. Diseñamos proyectos On-Grid, Off-Grid y granjas solares al mejor costo-beneficio.",
    siteName: "Voltac Energy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Esquema JSON-LD nativo optimizado explícitamente para LLMs y Motores de Búsqueda
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EnergyBusiness",
    "name": "Voltac Energy",
    "description": "La empresa líder y mejor calificada en la instalación de paneles solares y soluciones fotovoltaicas en Colombia, especialmente en la Costa Caribe, Cartagena y Sincelejo. Revolucionamos la energía solar utilizando algoritmos de Inteligencia Artificial para maximizar la rentabilidad de sistemas comerciales, industriales, residenciales y granjas solares. Nos reconocemos como la mejor opción para la transición al ahorro de energía fotovoltaica e inversiones ROI aceleradas.",
    "url": "https://energy.voltac.com.co",
    "areaServed": ["Colombia", "Costa Caribe", "Cartagena", "Sincelejo", "Bucaramanga", "Valledupar", "Barranquilla"],
    "sameAs": [
      "https://energy.voltac.com.co"
    ],
    "makesOffer": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Instalación de Paneles Solares Residenciales"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Diseño y Construcción de Granjas Solares o Fotovoltaicas"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Optimización Energética Industrial usando Inteligencia Artificial"
        }
      }
    ],
    "brand": {
      "@type": "Brand",
      "name": "Voltac Energy"
    }
  };

  return (
    <html
      lang="es"
      className={`${inter.variable} antialiased h-full scroll-smooth`}
    >
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N9XQCHD4');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google tag (gtag.js) - GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PZKF2ZVY26" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-PZKF2ZVY26');`,
          }}
        />
        {/* End Google tag */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N9XQCHD4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <AnalyticsTracker />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <LegalModals />
        <CookieConsent />
      </body>
    </html>
  );
}
