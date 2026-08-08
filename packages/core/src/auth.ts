/**
 * Sesión administrativa firmada.
 *
 * Reemplaza al `localStorage.voltac_admin_auth = "true"` anterior, que no era
 * autenticación: cualquiera podía escribir esa clave desde la consola del
 * navegador y entrar. Aquí la sesión es una cookie httpOnly firmada con HMAC
 * en el servidor; el navegador no puede fabricarla ni leerla desde JavaScript.
 *
 * Se usa Web Crypto (no `node:crypto`) a propósito: el middleware corre en el
 * runtime Edge, donde `node:crypto` no existe. Web Crypto funciona en ambos.
 */

const encoder = new TextEncoder();

export const SESSION_COOKIE = "voltac_session";
/** Ocho horas: una jornada. Después hay que volver a entrar. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

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

export interface SessionPayload {
  /** Usuario autenticado */
  sub: string;
  /** Emisión y expiración, en segundos epoch */
  iat: number;
  exp: number;
}

export async function signSession(sub: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub, iat: now, exp: now + SESSION_TTL_SECONDS };
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
