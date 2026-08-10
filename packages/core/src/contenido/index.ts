import { getDB } from "../db";
import {
  esEstado,
  esMarca,
  esTipo,
  type Actividad,
  type ActividadNueva,
} from "./types";

/**
 * Calendario editorial: acceso a datos.
 *
 * Es la primera pieza del panel de contenido. Todavía no publica nada en
 * ninguna red; sirve para que quien produce el contenido tenga su semana
 * delante y para que las etapas siguientes —temas, borradores, publicación
 * programada— tengan dónde colgarse.
 */

interface Fila {
  id: number;
  marca: string;
  titulo: string;
  tipo: string;
  inicia_en: string;
  duracion_min: number;
  todo_el_dia: number;
  estado: string;
  responsable: string | null;
  notas: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

function aActividad(f: Fila): Actividad {
  return {
    ...f,
    marca: esMarca(f.marca) ? f.marca : "ambas",
    tipo: esTipo(f.tipo) ? f.tipo : "recordatorio",
    estado: esEstado(f.estado) ? f.estado : "planificada",
    todo_el_dia: Boolean(f.todo_el_dia),
  };
}

/**
 * Actividades entre dos fechas, ambas incluidas.
 *
 * El rango se compara como texto porque las fechas se guardan en formato
 * `YYYY-MM-DDTHH:MM`, donde el orden alfabético y el cronológico coinciden. Es
 * lo que permite que el índice sirva sin funciones de fecha por medio.
 */
export async function actividadesEntre(desde: string, hasta: string): Promise<Actividad[]> {
  const db = await getDB();
  const filas = await db.all<Fila[]>(
    `SELECT * FROM cont.actividades
     WHERE inicia_en >= ? AND inicia_en <= ?
     ORDER BY inicia_en`,
    [`${desde}T00:00`, `${hasta}T23:59`],
  );
  return filas.map(aActividad);
}

function validar(datos: Partial<ActividadNueva>): string | null {
  if (datos.titulo !== undefined && !datos.titulo.trim()) return "La actividad necesita un título.";
  if (datos.marca !== undefined && !esMarca(datos.marca)) return "Marca desconocida.";
  if (datos.tipo !== undefined && !esTipo(datos.tipo)) return "Tipo de actividad desconocido.";
  if (datos.estado !== undefined && !esEstado(datos.estado)) return "Estado desconocido.";
  if (datos.inicia_en !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datos.inicia_en)) {
    return "La fecha y la hora no tienen el formato esperado.";
  }
  return null;
}

export async function crearActividad(
  datos: ActividadNueva,
  creadoPor: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const error = validar(datos);
  if (error) return { ok: false, error };

  const db = await getDB();
  const res = await db.run(
    `INSERT INTO cont.actividades
       (marca, titulo, tipo, inicia_en, duracion_min, todo_el_dia, estado, responsable, notas, creado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.marca,
      datos.titulo.trim(),
      datos.tipo,
      datos.inicia_en,
      Math.max(0, Math.min(datos.duracion_min || 60, 60 * 24)),
      datos.todo_el_dia ? 1 : 0,
      datos.estado,
      datos.responsable?.trim() || null,
      datos.notas?.trim() || null,
      creadoPor,
    ],
  );
  return { ok: true, id: res.lastID as number };
}

/** Actualiza solo los campos presentes; los ausentes se quedan como están. */
export async function actualizarActividad(
  id: number,
  datos: Partial<ActividadNueva>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const error = validar(datos);
  if (error) return { ok: false, error };

  const campos: string[] = [];
  const valores: unknown[] = [];

  const asignar = (columna: string, valor: unknown) => {
    campos.push(`${columna} = ?`);
    valores.push(valor);
  };

  if (datos.marca !== undefined) asignar("marca", datos.marca);
  if (datos.titulo !== undefined) asignar("titulo", datos.titulo.trim());
  if (datos.tipo !== undefined) asignar("tipo", datos.tipo);
  if (datos.inicia_en !== undefined) asignar("inicia_en", datos.inicia_en);
  if (datos.duracion_min !== undefined)
    asignar("duracion_min", Math.max(0, Math.min(datos.duracion_min, 60 * 24)));
  if (datos.todo_el_dia !== undefined) asignar("todo_el_dia", datos.todo_el_dia ? 1 : 0);
  if (datos.estado !== undefined) asignar("estado", datos.estado);
  if (datos.responsable !== undefined) asignar("responsable", datos.responsable?.trim() || null);
  if (datos.notas !== undefined) asignar("notas", datos.notas?.trim() || null);

  if (!campos.length) return { ok: true };

  asignar("actualizado_en", new Date().toISOString().slice(0, 19).replace("T", " "));
  valores.push(id);

  const db = await getDB();
  await db.run(`UPDATE cont.actividades SET ${campos.join(", ")} WHERE id = ?`, valores);
  return { ok: true };
}

/**
 * Borra una actividad.
 *
 * Aquí sí es un borrado real y no un archivado como en los prospectos: una
 * actividad mal puesta en el calendario es ruido, no información que valga la
 * pena conservar. Queda el rastro en la auditoría.
 */
export async function borrarActividad(id: number): Promise<void> {
  const db = await getDB();
  await db.run(`DELETE FROM cont.actividades WHERE id = ?`, [id]);
}
