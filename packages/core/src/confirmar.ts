import { sesionActual } from "./sesion";
import { auditar, confirmarPassword } from "./usuarios";
import { currentVertical } from "./vertical";

/**
 * Segunda confirmación para las acciones que no se pueden deshacer.
 *
 * Diez sitios entre las dos marcas pedían "la contraseña de administrador" y la
 * comparaban contra una cadena escrita en el propio código —"voltacenergy2026"
 * y "voltacsystems2026"—. Tres consecuencias, de peor a mejor:
 *
 *  1. Era un secreto **publicado en el repositorio**, y sigue estando en su
 *     historial. Cualquiera que haya tenido acceso al código lo conoce.
 *  2. No era la contraseña con la que uno entra al panel, así que quien la
 *     escribía correctamente recibía "contraseña incorrecta" sin explicación.
 *  3. No identificaba a nadie: la auditoría solo podía decir que "alguien que
 *     sabía la clave" borró algo.
 *
 * Aquí se comprueba contra la cuenta de quien está actuando. Eso arregla lo
 * tres: no hay secreto compartido que filtrar, es la contraseña que la persona
 * ya conoce, y el registro dice quién autorizó.
 *
 * Sigue siendo una segunda comprobación y no una tercera barrera: quien ya está
 * dentro puede borrar. Lo que evita es el descuido —el clic equivocado, la
 * sesión abierta en un portátil ajeno—, que en un panel de esta escala es el
 * riesgo real.
 */
export async function confirmarAccionSensible(
  pass: string,
  accion: string,
  detalle?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sesion = await sesionActual();
  if (!sesion) {
    return { ok: false, error: "La sesión no es válida. Vuelva a entrar." };
  }

  const correcta = await confirmarPassword(sesion.sub, pass ?? "");

  await auditar({
    usuario: sesion.sub,
    rol: sesion.rol,
    vertical: currentVertical(),
    accion: correcta ? accion : `${accion}_rechazada`,
    detalle,
  });

  if (!correcta) {
    return { ok: false, error: "Contraseña incorrecta. Es la misma con la que inició sesión." };
  }

  return { ok: true };
}
