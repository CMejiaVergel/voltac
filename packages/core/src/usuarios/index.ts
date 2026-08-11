import { getDB } from "../db";
import { adminConfig, hashPassword, hashObsoleto, verifyPassword } from "../auth";
import { esRol, type Rol } from "../roles";

/**
 * Cuentas del panel.
 *
 * Vive aparte de `auth.ts` para mantener separadas dos cosas distintas: allí se
 * verifica una firma, aquí se decide *quién* entra y con qué permisos. Esa
 * separación también deja `auth.ts` libre de dependencias nativas, que es lo
 * que permite importarlo desde cualquier sitio sin arrastrar SQLite.
 */

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
  ultimo_acceso: string | null;
  /**
   * Puesto con el que se presenta ante un cliente.
   *
   * No es decorativo: cuando un asesor atiende una conversación, el asistente
   * habla con SU nombre y SU cargo. Hasta ahora se presentaba siempre como la
   * misma persona, lo cual deja de servir en cuanto atiende alguien más.
   */
  cargo: string | null;
  telefono: string | null;
  documento: string | null;
}

/**
 * Siembra la cuenta del propietario a partir de las variables de entorno.
 *
 * Sin esto, el primer despliegue con la tabla vacía dejaría el panel
 * inaccesible: no habría usuarios y no habría por dónde crear el primero. Se
 * ejecuta antes de cada intento de acceso y no hace nada si ya hay alguien, así
 * que también repara el caso de haber borrado todas las cuentas por error.
 *
 * La contraseña llega en el formato antiguo —SHA-256 sin sal— porque es lo que
 * hay en el entorno. `verifyPassword` lo acepta y lo migra a PBKDF2 la primera
 * vez que el propietario entra.
 */
async function asegurarSemilla(): Promise<void> {
  const db = await getDB();
  const fila = await db.get<{ c: number }>("SELECT COUNT(*) c FROM sys.usuarios");
  if ((fila?.c ?? 0) > 0) return;

  const config = adminConfig();
  if (!config) return;

  await db.run(
    `INSERT OR IGNORE INTO sys.usuarios (usuario, nombre, password_hash, rol)
     VALUES (?, ?, ?, 'propietario')`,
    [config.username, "Propietario", config.passwordHash],
  );
}

export interface ResultadoAcceso {
  usuario: string;
  nombre: string;
  rol: Rol;
}

/**
 * Comprueba credenciales. Devuelve `null` en cualquier fallo, sin distinguir
 * entre usuario inexistente, contraseña incorrecta y cuenta desactivada: decirle
 * a quien prueba cuál de las tres fue le confirma la mitad del trabajo.
 */
export async function autenticar(
  usuario: string,
  password: string,
): Promise<ResultadoAcceso | null> {
  await asegurarSemilla();

  const db = await getDB();
  const fila = await db.get<{
    id: number;
    usuario: string;
    nombre: string;
    password_hash: string;
    rol: string;
    activo: number;
  }>(`SELECT id, usuario, nombre, password_hash, rol, activo FROM sys.usuarios WHERE usuario = ?`, [
    usuario.trim(),
  ]);

  if (!fila || !fila.activo) {
    // Se compara igualmente contra un hash de descarte para que un usuario
    // inexistente no responda antes que uno real: la diferencia de tiempo
    // bastaría para ir descubriendo qué nombres existen.
    await verifyPassword(password, "pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    return null;
  }

  if (!(await verifyPassword(password, fila.password_hash))) return null;
  if (!esRol(fila.rol)) return null;

  // Al entrar con un hash del formato antiguo se guarda ya en PBKDF2. La
  // migración ocurre sola, sin pedirle a nadie que cambie su contraseña.
  if (hashObsoleto(fila.password_hash)) {
    await db.run("UPDATE sys.usuarios SET password_hash = ? WHERE id = ?", [
      await hashPassword(password),
      fila.id,
    ]);
  }

  await db.run("UPDATE sys.usuarios SET ultimo_acceso = datetime('now') WHERE id = ?", [fila.id]);

  return { usuario: fila.usuario, nombre: fila.nombre || fila.usuario, rol: fila.rol };
}

/**
 * Confirma la contraseña de una cuenta sin abrir sesión.
 *
 * Es el segundo paso de las acciones destructivas: quien ya está dentro vuelve
 * a escribir su clave antes de borrar algo. Se comprueba contra la cuenta de
 * quien actúa y no contra una clave maestra compartida, para que la auditoría
 * pueda decir quién confirmó.
 */
export async function confirmarPassword(usuario: string, password: string): Promise<boolean> {
  const db = await getDB();
  const fila = await db.get<{ password_hash: string; activo: number }>(
    "SELECT password_hash, activo FROM sys.usuarios WHERE usuario = ?",
    [usuario],
  );
  if (!fila || !fila.activo) return false;
  return verifyPassword(password, fila.password_hash);
}

/**
 * Estado vigente de una cuenta, para comprobarlo en cada petición protegida.
 *
 * El token de sesión dice quién es y qué rol tenía **al entrar**. Esto dice qué
 * es ahora. La diferencia importa el día que hay que retirarle el acceso a
 * alguien: sin esta consulta, su cookie seguiría sirviendo hasta ocho horas
 * después de desactivar la cuenta.
 */
export async function estadoDeCuenta(
  usuario: string,
): Promise<{ rol: Rol; activo: boolean } | null> {
  const db = await getDB();
  const fila = await db.get<{ rol: string; activo: number }>(
    "SELECT rol, activo FROM sys.usuarios WHERE usuario = ?",
    [usuario],
  );
  if (!fila || !esRol(fila.rol)) return null;
  return { rol: fila.rol, activo: Boolean(fila.activo) };
}

export async function listarUsuarios(): Promise<Usuario[]> {
  await asegurarSemilla();
  const db = await getDB();
  const filas = await db.all<
    {
      id: number;
      usuario: string;
      nombre: string;
      rol: string;
      activo: number;
      creado_en: string;
      ultimo_acceso: string | null;
      cargo: string | null;
      telefono: string | null;
      documento: string | null;
    }[]
  >(`SELECT id, usuario, nombre, rol, activo, creado_en, ultimo_acceso, cargo, telefono, documento
     FROM sys.usuarios ORDER BY rol, usuario`);

  return filas
    .filter((f) => esRol(f.rol))
    .map((f) => ({ ...f, rol: f.rol as Rol, activo: Boolean(f.activo) }));
}

export async function crearUsuario(datos: {
  usuario: string;
  nombre: string;
  password: string;
  rol: Rol;
  cargo?: string;
  telefono?: string;
  documento?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const usuario = datos.usuario.trim();
  if (usuario.length < 3) return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
  if (datos.password.length < 10)
    return { ok: false, error: "La contraseña debe tener al menos 10 caracteres." };
  if (!esRol(datos.rol)) return { ok: false, error: "Rol desconocido." };

  const db = await getDB();
  const existe = await db.get("SELECT 1 FROM sys.usuarios WHERE usuario = ?", [usuario]);
  if (existe) return { ok: false, error: "Ese usuario ya existe." };

  await db.run(
    `INSERT INTO sys.usuarios (usuario, nombre, password_hash, rol, cargo, telefono, documento)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      usuario,
      datos.nombre.trim(),
      await hashPassword(datos.password),
      datos.rol,
      datos.cargo?.trim() || null,
      datos.telefono?.trim() || null,
      datos.documento?.trim() || null,
    ],
  );
  return { ok: true };
}

/** Actualiza los datos con que un asesor se presenta ante un cliente. */
export async function actualizarDatos(
  id: number,
  datos: { nombre?: string; cargo?: string; telefono?: string; documento?: string },
): Promise<boolean> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  for (const k of ["nombre", "cargo", "telefono", "documento"] as const) {
    const v = datos[k];
    if (v === undefined) continue;
    campos.push(`${k} = ?`);
    valores.push(v.trim() || null);
  }
  if (!campos.length) return false;

  const db = await getDB();
  valores.push(id);
  const r = await db.run(`UPDATE sys.usuarios SET ${campos.join(", ")} WHERE id = ?`, valores);
  return (r.changes ?? 0) > 0;
}

export async function cambiarPassword(id: number, password: string): Promise<boolean> {
  if (password.length < 10) return false;
  const db = await getDB();
  await db.run("UPDATE sys.usuarios SET password_hash = ? WHERE id = ?", [
    await hashPassword(password),
    id,
  ]);
  return true;
}

/**
 * Activa o desactiva una cuenta.
 *
 * Surte efecto en la siguiente petición: el proxy contrasta cada acceso a una
 * ruta protegida contra este campo, así que una sesión abierta se corta sola
 * sin esperar a que caduque la cookie. Nunca deja a la empresa sin
 * propietarios activos.
 */
export async function cambiarEstado(id: number, activo: boolean): Promise<boolean> {
  const db = await getDB();

  if (!activo) {
    const otros = await db.get<{ c: number }>(
      "SELECT COUNT(*) c FROM sys.usuarios WHERE rol = 'propietario' AND activo = 1 AND id <> ?",
      [id],
    );
    if ((otros?.c ?? 0) === 0) return false;
  }

  await db.run("UPDATE sys.usuarios SET activo = ? WHERE id = ?", [activo ? 1 : 0, id]);
  return true;
}

/** Anota una acción en el registro de auditoría. Nunca lanza: registrar no puede romper la operación. */
export async function auditar(entrada: {
  usuario: string | null;
  rol: string | null;
  vertical?: string;
  accion: string;
  detalle?: string;
  ip?: string;
}): Promise<void> {
  try {
    const db = await getDB();
    await db.run(
      `INSERT INTO sys.auditoria (usuario, rol, vertical, accion, detalle, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entrada.usuario,
        entrada.rol,
        entrada.vertical ?? null,
        entrada.accion,
        entrada.detalle ?? null,
        entrada.ip ?? null,
      ],
    );
  } catch {
    /* el registro es secundario */
  }
}
