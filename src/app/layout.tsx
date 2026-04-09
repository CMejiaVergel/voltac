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
  title: "Voltac Systems | IA, Automatización y Software a Medida",
  description: "Aceleramos tu negocio con Inteligencia Artificial, Agentes Cognitivos y Software Web/App a medida. Transforma tus operaciones con automatización B2B.",
  keywords: ["inteligencia artificial", "desarrollo web", "automatización b2b", "agentes de ventas", "iot", "desarrollo a medida", "colombia", "voltac systems"],
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
