import type { NextConfig } from "next";
import { baseConfig } from "@voltac/core/next-config";

/* La configuracion comun vive en el nucleo y la comparten las dos marcas.
   Aqui solo lo propio de esta aplicacion. */
const nextConfig: NextConfig = {
  ...baseConfig,

  experimental: {
    ...baseConfig.experimental,

    /*
     * Cuando hay proxy, Next copia el cuerpo de cada peticion a memoria para
     * que se pueda leer dos veces. El limite por defecto son 10 MB, y al
     * pasarse **no falla**: guarda los primeros 10 MB y sigue. Un multipart
     * cortado por la mitad ya no se puede interpretar.
     *
     * Eso es lo que rompia la cotizacion expres: la foto de una factura hecha
     * con un movil actual pesa entre 8 y 15 MB, el cuerpo llegaba truncado,
     * `formData()` lanzaba y el prospecto se perdia sin que nadie se enterara.
     *
     * Ahora el formulario reduce las fotos en el navegador antes de subirlas,
     * asi que esto es la red de seguridad para lo que no se puede comprimir
     * —un PDF de recibo escaneado— y para navegadores donde la compresion no
     * funcione.
     */
    proxyClientMaxBodySize: "28mb",

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
