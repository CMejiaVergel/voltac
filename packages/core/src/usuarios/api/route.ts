import { NextResponse } from "next/server";
import { cambiarEstado, cambiarPassword, crearUsuario, listarUsuarios, auditar } from "../index";
import { sesionActual } from "../../sesion";
import { esRol } from "../../roles";
import { currentVertical } from "../../vertical";

/**
 * Gestión de cuentas del panel.
 *
 * El proxy ya deja pasar solo al propietario —`/api/usuarios` está en el mapa
 * de acceso—, pero aquí se vuelve a leer la sesión por dos razones: para saber
 * a nombre de quién anotar en la auditoría, y porque una ruta que administra
 * cuentas no debería depender de que nadie la saque de esa lista por descuido.
 */

async function exigirPropietario() {
  const sesion = await sesionActual();
  if (!sesion || sesion.rol !== "propietario") return null;
  return sesion;
}

export async function GET() {
  if (!(await exigirPropietario())) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: await listarUsuarios() });
}

export async function POST(req: Request) {
  const sesion = await exigirPropietario();
  if (!sesion) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const datos = await req.json();
  if (!esRol(datos.rol)) {
    return NextResponse.json({ success: false, error: "Rol desconocido." }, { status: 400 });
  }

  const resultado = await crearUsuario({
    usuario: String(datos.usuario ?? ""),
    nombre: String(datos.nombre ?? ""),
    password: String(datos.password ?? ""),
    rol: datos.rol,
  });

  if (!resultado.ok) {
    return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
  }

  await auditar({
    usuario: sesion.sub,
    rol: sesion.rol,
    vertical: currentVertical(),
    accion: "usuario_creado",
    detalle: `${datos.usuario} (${datos.rol})`,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const sesion = await exigirPropietario();
  if (!sesion) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const { id, password, activo } = await req.json();
  if (typeof id !== "number") {
    return NextResponse.json({ success: false, error: "Falta el identificador." }, { status: 400 });
  }

  if (typeof password === "string") {
    if (!(await cambiarPassword(id, password))) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 10 caracteres." },
        { status: 400 },
      );
    }
    await auditar({
      usuario: sesion.sub,
      rol: sesion.rol,
      vertical: currentVertical(),
      accion: "password_restablecida",
      detalle: `usuario ${id}`,
    });
  }

  if (typeof activo === "boolean") {
    if (!(await cambiarEstado(id, activo))) {
      // Dejar la empresa sin ningun propietario activo cierra el panel para
      // siempre: no quedaria nadie que pudiera volver a abrirlo.
      return NextResponse.json(
        { success: false, error: "No puede desactivar al último propietario activo." },
        { status: 400 },
      );
    }
    await auditar({
      usuario: sesion.sub,
      rol: sesion.rol,
      vertical: currentVertical(),
      accion: activo ? "usuario_activado" : "usuario_desactivado",
      detalle: `usuario ${id}`,
    });
  }

  return NextResponse.json({ success: true });
}
