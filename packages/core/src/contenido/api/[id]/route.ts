import { NextResponse } from "next/server";
import { actualizarActividad, borrarActividad } from "../../index";
import { sesionActual } from "../../../sesion";
import { auditar } from "../../../usuarios";
import { currentVertical } from "../../../vertical";

async function exigirSesion() {
  const sesion = await sesionActual();
  if (!sesion || (sesion.rol !== "propietario" && sesion.rol !== "moderador")) return null;
  return sesion;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirSesion();
  if (!sesion) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ success: false, error: "Identificador inválido." }, { status: 400 });
  }

  const resultado = await actualizarActividad(id, await req.json());
  if (!resultado.ok) {
    return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirSesion();
  if (!sesion) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ success: false, error: "Identificador inválido." }, { status: 400 });
  }

  await borrarActividad(id);

  await auditar({
    usuario: sesion.sub,
    rol: sesion.rol,
    vertical: currentVertical(),
    accion: "actividad_borrada",
    detalle: `actividad ${id}`,
  });

  return NextResponse.json({ success: true });
}
