/**
 * Sesión administrativa firmada.
 *
 * Reemplaza al `localStorage.voltac_admin_auth = "true"` anterior, que no era
 * autenticación: cualquiera podía escribir esa clave desde la consola del
 * navegador y entrar. Aquí la sesión es una cookie httpOnly firmada con HMAC
 * en el servidor; el navegador no puede fabricarla ni leerla desde JavaScript.
 *
 * Se usa Web Crypto y no `node:crypto`. La razón original era que el
 * middleware corría en el runtime Edge; desde Next 16 el proxy corre en Node,
 * así que ya no es una obligación. Se mantiene porque Web Crypto funciona en
 * los dos runtimes y este archivo lo importan tanto el proxy como el navegador
 * a través de la sesión: una dependencia menos de la que preocuparse si algo
 * vuelve a moverse de sitio.
 */

import { esRol, type Rol } from "./roles";

const encoder = new TextEncoder();

export const SESSION_COOKIE = "voltac_session";
/** Ocho horas: una jornada. Después hay que volver a entrar. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

/**
 * La sesión larga, para quien marca "mantener sesión iniciada".
 *
 * Existe por el panel instalado como aplicación. Con ocho horas fijas, abrirla
 * por la mañana daba SIEMPRE una pantalla en blanco: la sesión había muerto de
 * madrugada y `start_url` apunta a `/admin`, que sin cookie no responde nada.
 * Una aplicación en la que hay que volver a entrar cada día no se usa.
 *
 * Es opcional a propósito. El valor por defecto NO cambia: quien entra desde
 * un equipo compartido sigue teniendo su jornada de ocho horas y nada más. La
 * sesión larga se pide, no se impone.
 *
 * Treinta días de INACTIVIDAD, no de vida: cada visita la renueva. Y por
 * encima de eso, un tope absoluto que ninguna renovación puede saltar, para
 * que una sesión no viva indefinidamente aunque se use a diario.
 */
export const SESSION_TTL_RECORDADA = 30 * 24 * 60 * 60;
export const SESSION_MAX_RECORDADA = 90 * 24 * 60 * 60;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** SHA-256 en hexadecimal. Se usa para comparar la contraseña sin guardarla en claro. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Comparación en tiempo constante. Un `===` sobre secretos filtra información
 * por el tiempo que tarda en fallar; con cadenas cortas el riesgo es teórico,
 * pero no cuesta nada hacerlo bien.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Almacenamiento de contraseñas.
 *
 * PBKDF2 con sal por usuario. Un SHA-256 a secas —lo que había cuando solo
 * existía una cuenta en variables de entorno— se rompe con tablas precalculadas
 * si alguien llega a leer la base: la misma contraseña produce siempre el mismo
 * hash. La sal impide reutilizar ese trabajo entre usuarios y las iteraciones
 * hacen que cada intento cueste tiempo real.
 *
 * Web Crypto y no `node:crypto` por la misma razón que el resto del archivo:
 * funciona en los dos runtimes.
 */
const PBKDF2_ITERACIONES = 210_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERACIONES);
  return `pbkdf2$${PBKDF2_ITERACIONES}$${base64url(salt)}$${base64url(hash)}`;
}

/**
 * Comprueba una contraseña contra lo guardado.
 *
 * Acepta también el formato antiguo —SHA-256 hexadecimal sin sal— porque la
 * cuenta del propietario se sembró desde `ADMIN_PASSWORD_HASH`. Al cambiar esa
 * contraseña desde el panel, el registro pasa solo al formato nuevo.
 */
export async function verifyPassword(password: string, almacenado: string): Promise<boolean> {
  if (!almacenado) return false;

  if (almacenado.startsWith("pbkdf2$")) {
    const [, iter, salt, esperado] = almacenado.split("$");
    const iteraciones = Number(iter);
    if (!Number.isFinite(iteraciones) || iteraciones < 1000 || !salt || !esperado) return false;
    const hash = await pbkdf2(password, fromBase64url(salt), iteraciones);
    return safeEqual(base64url(hash), esperado);
  }

  return safeEqual(await sha256Hex(password), almacenado);
}

/** `true` si el hash está en el formato antiguo y conviene renovarlo al entrar. */
export function hashObsoleto(almacenado: string): boolean {
  return !almacenado.startsWith("pbkdf2$");
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iteraciones: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iteraciones, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export interface SessionPayload {
  /** Usuario autenticado */
  sub: string;
  /**
   * Rol, dentro del propio token firmado.
   *
   * Viaja aquí para que la interfaz pueda pintar el menú sin consultar nada, y
   * la firma HMAC impide que el navegador se lo cambie. No es la única fuente:
   * el proxy contrasta este valor contra el estado vigente de la cuenta en cada
   * petición protegida, así que un token con un rol que ya no corresponde deja
   * de servir en el acto.
   */
  rol: Rol;
  /** Emisión y expiración, en segundos epoch */
  iat: number;
  exp: number;
  /**
   * Cuándo empezó la sesión de verdad, no la última renovación.
   *
   * Sin esto, una sesión larga que se renueva sola no caducaría nunca: cada
   * visita empujaría el vencimiento y el tope absoluto sería inalcanzable.
   * Se conserva intacto entre renovaciones.
   *
   * Opcional porque las cookies emitidas antes de que existiera no lo traen;
   * ahí se toma `iat`, que para una sesión sin renovar es lo mismo.
   */
  ini?: number;
  /** Si es una sesión larga. Decide qué ventana se aplica al renovarla. */
  rec?: boolean;
}

export interface OpcionesSesion {
  /** Sesión larga y renovable. Ver `SESSION_TTL_RECORDADA`. */
  recordar?: boolean;
  /** Inicio original, al renovar. Omitir al entrar por primera vez. */
  ini?: number;
}

export async function signSession(
  sub: string,
  rol: Rol,
  secret: string,
  opciones: OpcionesSesion = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const recordar = Boolean(opciones.recordar);
  const payload: SessionPayload = {
    sub,
    rol,
    iat: now,
    exp: now + (recordar ? SESSION_TTL_RECORDADA : SESSION_TTL_SECONDS),
    ini: opciones.ini ?? now,
    rec: recordar || undefined,
  };
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${base64url(sig)}`;
}

/** Devuelve la sesión si la firma es válida y no expiró; si no, `null`. */
export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Sin rol reconocible no hay sesión. Las cookies emitidas antes de que
    // existieran los roles caen aquí: obligan a entrar de nuevo, que es lo
    // correcto, en lugar de heredar un permiso indefinido.
    if (!esRol(payload.rol)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Configuración de acceso, leída del entorno.
 *
 * Si falta el secreto o el hash, el sistema **niega el acceso** en lugar de
 * abrirlo. Un despliegue mal configurado deja el panel inaccesible, que es
 * molesto; lo contrario deja la contabilidad abierta a internet.
 */
export function adminConfig(): { secret: string; username: string; passwordHash: string } | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!secret || secret.length < 32 || !username || !passwordHash) return null;
  return { secret, username, passwordHash };
}
