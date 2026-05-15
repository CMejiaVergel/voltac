import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages must NOT be bundled by Turbopack — they rely on native Node.js fs/canvas bindings
  serverExternalPackages: ['sharp', 'pdf-parse', 'pdfjs-dist', 'canvas', 'sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
