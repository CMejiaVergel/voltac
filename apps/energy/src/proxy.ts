/**
 * Puente al portero del nucleo.
 *
 * La logica de control de acceso y las cabeceras viven en @voltac/core: una
 * sola implementacion para las dos lineas de negocio. Tenerla duplicada ya
 * causo que las rutas de contabilidad quedaran sin proteger en una de las dos.
 *
 * `config` se declara aqui porque Next necesita leer el `matcher` de forma
 * estatica en cada aplicacion; no contiene reglas de seguridad.
 */
import { proxy } from "@voltac/core/proxy";

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml)$).*)",
  ],
};
