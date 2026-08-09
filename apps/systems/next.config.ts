import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages must NOT be bundled by Turbopack — they rely on native Node.js fs/canvas bindings
  serverExternalPackages: ['sharp', 'pdf-parse', 'pdfjs-dist', 'canvas', 'sqlite3'],

  // No anunciar el framework ni su version: es informacion gratis para quien
  // busca vulnerabilidades conocidas.
  poweredByHeader: false,

  images: {
    // AVIF primero: pesa ~15% menos que WebP con la misma calidad percibida.
    formats: ['image/avif', 'image/webp'],
    // Anchos reales del diseno; generar tamanos que nadie pide cuesta CPU en
    // el VPS y llena el cache en disco.
    deviceSizes: [375, 640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
  },

  experimental: {
    serverActions: {
      // Antes 50mb. Con las acciones abiertas a internet, ese limite era un
      // vector de agotamiento de memoria: una peticion podia reservar 50 MB.
      // La subida real mas pesada son PDFs de factura.
      bodySizeLimit: '8mb',
    },
    // Evita cargar el paquete completo de iconos para usar seis.
    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion'],
  },

  async headers() {
    return [
      {
        // Refuerzo estatico de las cabeceras que pone el middleware. Este bloque
        // tambien cubre lo que no pasa por middleware (assets de _next).
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
