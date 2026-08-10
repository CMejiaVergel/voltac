import { NextResponse } from "next/server";
import { actividadesEntre, crearActividad } from "../index";
import { sesionActual } from "../../sesion";
import { auditar } from "../../usuarios";
import { currentVertical } from "../../vertical";

/**
 * Actividades del calendario editorial.
 *
 * El proxy ya limita `/api/contenido` a propietario y moderador. Aquí se vuelve
 * a leer la sesión para saber a nombre de quién crear y anotar, no para
 * autorizar de nuevo.
 */

async function exigirSesion() {
  const sesion = await sesionActual();
  if (!sesion || (sesion.rol !== "propietario" && sesion.rol !== "moderador")) return null;
  return sesion;
}

export async function GET(req: Request) {
  if (!(await exigirSesion())) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = searchParams.get("desde") ?? hoy;
  const hasta = searchParams.get("hasta") ?? hoy;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return NextResponse.json({ success: false, error: "Rango de fechas inválido." }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: await actividadesEntre(desde, hasta) });
}

export async function POST(req: Request) {
  const sesion = await exigirSesion();
  if (!sesion) {
    return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
  }

  const datos = await req.json();
  const resultado = await crearActividad(datos, sesion.sub);

  if (!resultado.ok) {
    return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
  }

  await auditar({
    usuario: sesion.sub,
    rol: sesion.rol,
    vertical: currentVertical(),
    accion: "actividad_creada",
    detalle: `${datos.tipo} · ${datos.titulo}`,
  });

  return NextResponse.json({ success: true, id: resultado.id });
}
