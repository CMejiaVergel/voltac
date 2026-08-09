import type { NextConfig } from "next";
import { baseConfig } from "@voltac/core/next-config";

/* La configuracion comun vive en el nucleo y la comparten las dos marcas.
   Aqui solo lo propio de esta aplicacion. */
const nextConfig: NextConfig = {
  ...baseConfig,

  experimental: {
    ...baseConfig.experimental,
    serverActions: {
      /*
       * Mas alto que el comun por una razon concreta: las fotos de obra de
       * esta marca vienen de dron y pesan entre 10 y 25 MB antes de que el
       * servidor las comprima. Con el limite comun de 8 MB, subir una obra
       * fallaria sin decir por que.
       *
       * El riesgo que motivo bajar el limite —una peticion reservando memoria
       * a voluntad— queda acotado: las acciones que reciben archivos viven
       * bajo /admin, y ahi el proxy exige sesion antes de leer el cuerpo.
       */
      bodySizeLimit: "28mb",
    },
  },
};

export default nextConfig;
