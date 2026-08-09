import type { NextConfig } from "next";

/**
 * Configuración común de las dos aplicaciones.
 *
 * Estaba duplicada a medias: Systems tenía el endurecimiento —cabecera de
 * framework oculta, límite de cuerpo bajado, formatos e imágenes afinados— y
 * Energy se había quedado con el archivo original, incluido el
 * `bodySizeLimit: '50mb'` que ya habíamos corregido en la otra marca por ser un
 * vector de agotamiento de memoria.
 *
 * Es el mismo patrón que el proxy y el login: una implementación, dos marcas.
 * Cada aplicación extiende esto y añade solo lo suyo.
 */
export const baseConfig: NextConfig = {
  // Estos paquetes NO los puede empaquetar Turbopack: dependen de binarios
  // nativos de Node.
  serverExternalPackages: ["sharp", "pdf-parse", "pdfjs-dist", "canvas", "sqlite3"],

  // No anunciar el framework ni su version: es informacion gratis para quien
  // busca vulnerabilidades conocidas.
  poweredByHeader: false,

  images: {
    // AVIF primero: pesa ~15% menos que WebP con la misma calidad percibida.
    formats: ["image/avif", "image/webp"],
    // Anchos reales del diseno; generar tamanos que nadie pide cuesta CPU en
    // el VPS y llena el cache en disco.
    deviceSizes: [375, 640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Un SVG puede llevar JavaScript dentro. Servirlo optimizado desde nuestro
    // dominio lo convertiria en un XSS de origen propio.
    dangerouslyAllowSVG: false,
    // Next 16 exige declarar las calidades permitidas: cualquier otra se
    // ignora con un aviso y la imagen sale con la de por defecto.
    qualities: [70, 75],
  },

  experimental: {
    serverActions: {
      // Antes 50mb. Con las acciones abiertas a internet, ese limite era un
      // vector de agotamiento de memoria: una peticion podia reservar 50 MB.
      // La subida real mas pesada son PDFs de factura.
      bodySizeLimit: "8mb",
    },
    // Evita cargar el paquete completo de iconos para usar seis.
    optimizePackageImports: ["lucide-react", "react-icons", "framer-motion"],
  },

  async headers() {
    return [
      {
        // Refuerzo estatico de las cabeceras que pone el proxy. Este bloque
        // tambien cubre lo que no pasa por el proxy (assets de _next).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};
