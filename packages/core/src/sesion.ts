import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SESSION_TTL_RECORDADA,
  adminConfig,
  signSession,
  verifySession,
  type SessionPayload,
} from "./auth";
import { alcanzaMarca, MARCA_ETIQUETA } from "./roles";
import { autenticar, auditar, estadoDeCuenta } from "./usuarios";
import { currentVertical } from "./vertical";

/**
 * Inicio y cierre de sesión, comunes a las dos marcas.
 *
 * Esta lógica estaba duplicada en `apps/systems` y `apps/energy`, igual que
 * estuvo el proxy. Se unifica por la misma razón: el control de acceso solo es
 * fiable si hay una sola implementación que revisar.
 *
 * Las funciones no llevan `"use server"`. Cada aplicación las envuelve en su
 * propio archivo de acciones porque Next registra las acciones de servidor por
 * aplicación; aquí vive el contenido, allí la declaración.
 */

/** Retardo fijo para que un intento fallido no sea más rápido que uno válido. */
const FAILURE_DELAY_MS = 600;

/**
 * Freno de fuerza bruta.
 *
 * fail2ban protege el SSH; el login web no tenía ningún límite propio. Cinco
 * fallos bloquean esa IP durante quince minutos.
 *
 * El registro vive en memoria a propósito: es una dependencia menos y se
 * reinicia con cada despliegue, lo cual es aceptable porque Nginx aplica un
 * segundo límite por delante.
 */
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60_000;
const intentos = new Map<string, { fallos: number; desde: number }>();

function clienteId(headerList: Headers): string {
  // Nginx envía X-Forwarded-For; el primer valor es el cliente real.
  const fwd = headerList.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : headerList.get("x-real-ip")) ?? "desconocido";
}

function bloqueado(id: string): number {
  const registro = intentos.get(id);
  if (!registro) return 0;
  const transcurrido = Date.now() - registro.desde;
  if (transcurrido > VENTANA_MS) {
    intentos.delete(id);
    return 0;
  }
  if (registro.fallos < MAX_INTENTOS) return 0;
  return Math.ceil((VENTANA_MS - transcurrido) / 60_000);
}

function registrarFallo(id: string): void {
  const registro = intentos.get(id);
  if (!registro || Date.now() - registro.desde > VENTANA_MS) {
    intentos.set(id, { fallos: 1, desde: Date.now() });
    return;
  }
  registro.fallos += 1;
}

export async function iniciarSesion(formData: FormData): Promise<{ error?: string }> {
  if (!adminConfig()) {
    return {
      error:
        "El acceso administrativo no está configurado en este servidor. Defina ADMIN_SESSION_SECRET, ADMIN_USERNAME y ADMIN_PASSWORD_HASH.",
    };
  }
  const config = adminConfig()!;

  const ip = clienteId(await headers());
  const minutosRestantes = bloqueado(ip);
  if (minutosRestantes > 0) {
    return {
      error: `Demasiados intentos fallidos. Vuelva a intentarlo en ${minutosRestantes} minuto${
        minutosRestantes === 1 ? "" : "s"
      }.`,
    };
  }

  const usuario = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const acceso = await autenticar(usuario, password);

  if (!acceso) {
    registrarFallo(ip);
    await auditar({
      usuario: usuario.slice(0, 60) || null,
      rol: null,
      vertical: currentVertical(),
      accion: "acceso_fallido",
      ip,
    });
    await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
    return { error: "Credenciales incorrectas." };
  }

  // Un acierto limpia el historial: quien ya demostró conocer la clave no
  // debería quedar bloqueado por haberse equivocado antes.
  intentos.delete(ip);

  /*
   * Las credenciales son válidas, pero ¿es esta su marca?
   *
   * El proxy ya lo comprueba en cada petición, así que sin esto la persona
   * entraría "bien" y a continuación recibiría 404 en todo, sin saber por qué.
   * Aquí se le dice, porque no es un fallo de seguridad sino de sitio: la
   * cuenta existe y la clave es correcta, solo que este no es su panel.
   *
   * No se registra como acceso fallido ni cuenta para el bloqueo por fuerza
   * bruta: quien acertó la contraseña no es un atacante probando claves.
   */
  const cuenta = await estadoDeCuenta(acceso.usuario);
  const vertical = currentVertical();
  if (cuenta && !alcanzaMarca(cuenta.marca, vertical)) {
    await auditar({
      usuario: acceso.usuario,
      rol: acceso.rol,
      vertical,
      accion: "acceso_marca_incorrecta",
      detalle: `la cuenta es de ${MARCA_ETIQUETA[cuenta.marca]}`,
      ip,
    });
    return {
      error: `Esta cuenta es de ${MARCA_ETIQUETA[cuenta.marca]}. Entra por el panel de esa línea de negocio.`,
    };
  }

  /* La casilla "mantener sesión iniciada". Es opcional y va apagada por
     defecto: quien entra desde un equipo compartido conserva su jornada de
     ocho horas. La marca quien usa el panel instalado en su propio telefono,
     donde volver a entrar cada manana lo hace inservible. */
  const recordar = formData.get("recordar") === "on";

  const token = await signSession(acceso.usuario, acceso.rol, config.secret, { recordar });
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: recordar ? SESSION_TTL_RECORDADA : SESSION_TTL_SECONDS,
  });

  await auditar({
    usuario: acceso.usuario,
    rol: acceso.rol,
    vertical: currentVertical(),
    accion: "acceso",
    ip,
  });

  return {};
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Sesión de la petición en curso, para código de servidor.
 *
 * El proxy ya garantiza que nadie sin sesión válida llega a una ruta protegida.
 * Esto es para saber *quién* llegó: qué rol pintar en la navegación, a nombre de
 * quién anotar en la auditoría, y qué acciones ofrecer.
 */
export async function sesionActual(): Promise<SessionPayload | null> {
  const config = adminConfig();
  if (!config) return null;
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value, config.secret);
}
