import type { NextConfig } from "next";
import { baseConfig } from "@voltac/core/next-config";

/* La configuracion comun vive en el nucleo y la comparten las dos marcas.
   Aqui solo lo propio de esta aplicacion. */
const nextConfig: NextConfig = {
  ...baseConfig,
};

export default nextConfig;
