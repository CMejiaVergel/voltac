import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { conectarGoogle } from "../acciones-avanzadas";

/**
 * Donde vuelve Google después de autorizar.
 *
 * Existe para no depender de un túnel SSH. El asistente escucha solo en
 * loopback, así que su propia URL de retorno no la alcanza el navegador de
 * nadie: la primera vez que se conectó Google hubo que abrir un túnel para
 * completar este paso. El panel sí está publicado, así que recibe el código
 * aquí y se lo entrega al asistente por dentro de la máquina.
 *
 * El código de Google se usa una sola vez y caduca en minutos, así que no hay
 * nada que proteger en la URL más allá de que esta ruta ya es del propietario.
 */
export default async function GoogleCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : undefined;
  const errorGoogle = typeof params.error === "string" ? params.error : undefined;

  let error: string | undefined = errorGoogle
    ? `Google devolvió: ${errorGoogle}`
    : code
      ? undefined
      : "Google no envió ningún código. Vuelve a intentarlo desde Configuración.";
  let cuenta: string | undefined;

  if (code && !error) {
    const r = await conectarGoogle(code);
    if (r.ok) cuenta = r.datos?.cuenta;
    else error = r.error;
  }

  return (
    <div className="max-w-lg mx-auto mt-16 bg-card border border-border rounded-xl p-8 text-center">
      {error ? (
        <>
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={22} />
          </div>
          <h1 className="text-lg font-bold mt-4">No se pudo conectar Google</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          {/* El fallo casi siempre es este, y decirlo aquí ahorra media hora. */}
          {error.includes("redirect_uri_mismatch") && (
            <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">
              Falta registrar esta dirección en Google Cloud Console, en las URI de redirección
              autorizadas del cliente OAuth. La dirección exacta aparece en Configuración, junto al botón de
              conectar.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="text-lg font-bold mt-4">Google Workspace conectado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {cuenta ? (
              <>
                El asistente ya puede consultar y crear reuniones en la agenda de{" "}
                <strong className="text-secondary">{cuenta}</strong>.
              </>
            ) : (
              "El asistente ya puede consultar y crear reuniones en el calendario."
            )}
          </p>
        </>
      )}

      <Link
        href="/admin/ia-assistant/configuracion"
        className="inline-block mt-6 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
      >
        Volver a Configuración
      </Link>
    </div>
  );
}
