"use server";

import { revalidatePath } from "next/cache";
import { getDB } from "../db";
import { sesionActual } from "../sesion";
import { URGENCIA, type DatosTarea, type EstadoTarea, type Tarea, type TipoTarea } from "./tipos";

export interface Resultado<T = void> {
  ok: boolean;
  error?: string;
  datos?: T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function aTarea(f: any): Tarea {
  let datos: DatosTarea = {};
  try {
    datos = JSON.parse(f.datos ?? "{}");
  } catch {
    // Un JSON corrupto no puede dejar la pantalla en blanco: la tarea sigue
    // siendo visible y accionable aunque sus datos se hayan perdido.
    datos = {};
  }
  return {
    id: f.id,
    tipo: f.tipo,
    estado: f.estado,
    titulo: f.titulo,
    detalle: f.detalle ?? "",
    quoteId: f.quoteId ?? null,
    conversationId: f.conversationId ?? null,
    datos,
    venceEn: f.venceEn ?? null,
    creadaEn: f.creadaEn,
    resueltaEn: f.resueltaEn ?? null,
    resueltaPor: f.resueltaPor ?? null,
    nota: f.nota ?? null,
  };
}

/**
 * Las tareas, las pendientes primero y por urgencia.
 *
 * Se traen también las cerradas —limitadas— porque la pregunta que más se hace
 * frente a esta pantalla no es "qué falta" sino "esto ya lo resolvió alguien?".
 */
export async function listarTareas(): Promise<Resultado<Tarea[]>> {
  try {
    const db = await getDB();
    const filas = await db.all(`
      SELECT * FROM tareas
      WHERE estado = 'pendiente'
         OR resueltaEn > datetime('now', '-7 days')
      ORDER BY creadaEn DESC
      LIMIT 200
    `);

    const tareas = filas.map(aTarea).sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === "pendiente" ? -1 : 1;
      const u = URGENCIA[a.tipo] - URGENCIA[b.tipo];
      if (u !== 0) return u;
      return a.creadaEn < b.creadaEn ? -1 : 1;
    });

    return { ok: true, datos: tareas };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudieron leer las tareas." };
  }
}

/**
 * Crea una tarea, sin duplicar.
 *
 * La misma causa puede dispararse varias veces —se pulsa "redactar mensaje" dos
 * veces sobre el mismo prospecto con la factura ilegible— y una lista con la
 * misma tarea repetida deja de leerse. Si ya hay una pendiente del mismo tipo
 * para el mismo prospecto, se actualiza en vez de añadir otra.
 */
export async function crearTarea(t: {
  tipo: TipoTarea;
  titulo: string;
  detalle?: string;
  quoteId?: number | null;
  conversationId?: string | null;
  datos?: DatosTarea;
  venceEn?: string | null;
}): Promise<Resultado<number>> {
  try {
    const db = await getDB();

    const existente = t.quoteId
      ? await db.get(
          `SELECT id FROM tareas WHERE estado = 'pendiente' AND tipo = ? AND quoteId = ?`,
          [t.tipo, t.quoteId],
        )
      : null;

    if (existente) {
      await db.run(`UPDATE tareas SET titulo = ?, detalle = ?, datos = ? WHERE id = ?`, [
        t.titulo,
        t.detalle ?? "",
        JSON.stringify(t.datos ?? {}),
        existente.id,
      ]);
      revalidatePath("/admin/ia-assistant/tareas");
      return { ok: true, datos: existente.id };
    }

    const r = await db.run(
      `INSERT INTO tareas (tipo, titulo, detalle, quoteId, conversationId, datos, venceEn)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        t.tipo,
        t.titulo,
        t.detalle ?? "",
        t.quoteId ?? null,
        t.conversationId ?? null,
        JSON.stringify(t.datos ?? {}),
        t.venceEn ?? null,
      ],
    );

    revalidatePath("/admin/ia-assistant/tareas");
    return { ok: true, datos: r.lastID as number };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo crear la tarea." };
  }
}

/**
 * Resuelve una tarea de recibo con los datos escritos a mano.
 *
 * Lo escrito NO se queda en la tarea: se copia a la ficha del prospecto, que es
 * de donde el asistente lee cuando redacta. Guardarlo solo aquí obligaría a
 * inventar un camino nuevo entre las tareas y el asistente, y ese camino ya
 * existe y funciona.
 *
 * El consumo va a `consumoPicoKwh` y no a `consumption` a propósito: no son lo
 * mismo. `consumption` es lo que la persona recuerda; el pico es el mes más
 * alto de la factura, y es sobre el que se dimensiona.
 */
export async function resolverTareaRecibo(
  id: number,
  valores: { consumoPicoKwh?: number; direccion?: string },
): Promise<Resultado> {
  try {
    if (!valores.consumoPicoKwh && !valores.direccion?.trim()) {
      return { ok: false, error: "Escribe al menos uno de los dos datos." };
    }
    if (valores.consumoPicoKwh !== undefined) {
      const n = valores.consumoPicoKwh;
      if (!Number.isFinite(n) || n <= 0 || n > 100_000) {
        return { ok: false, error: "El consumo pico tiene que ser un número entre 1 y 100.000 kWh." };
      }
    }

    const db = await getDB();
    const tarea = await db.get(`SELECT * FROM tareas WHERE id = ?`, [id]);
    if (!tarea) return { ok: false, error: "Esa tarea ya no existe." };
    if (tarea.estado !== "pendiente") return { ok: false, error: "Esa tarea ya está cerrada." };

    if (tarea.quoteId) {
      const campos: string[] = [];
      const args: unknown[] = [];
      if (valores.consumoPicoKwh !== undefined) {
        campos.push("consumoPicoKwh = ?");
        args.push(valores.consumoPicoKwh);
      }
      if (valores.direccion?.trim()) {
        campos.push("address = ?");
        args.push(valores.direccion.trim());
      }
      if (campos.length) {
        args.push(tarea.quoteId);
        await db.run(`UPDATE quotes SET ${campos.join(", ")} WHERE id = ?`, args);
      }
    }

    const datos: DatosTarea = { ...JSON.parse(tarea.datos ?? "{}"), ...valores };
    const quien = (await sesionActual())?.sub ?? "";

    await db.run(
      `UPDATE tareas SET estado = 'resuelta', resueltaEn = datetime('now'), resueltaPor = ?, datos = ?
       WHERE id = ?`,
      [quien, JSON.stringify(datos), id],
    );

    revalidatePath("/admin/ia-assistant/tareas");
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo resolver la tarea." };
  }
}

/**
 * Cierra una tarea que no se pudo resolver.
 *
 * No es un botón de descarte. Para el asistente significa algo concreto: el
 * dato no va a llegar del equipo, así que a partir de aquí se lo pide al
 * cliente durante la conversación. Por eso pide un motivo: es lo que después
 * explica por qué se le preguntó algo que se suponía que ya teníamos.
 */
export async function cerrarSinSolucion(id: number, nota: string): Promise<Resultado> {
  try {
    if (!nota.trim()) return { ok: false, error: "Escribe por qué no se pudo." };

    const db = await getDB();
    const tarea = await db.get(`SELECT estado FROM tareas WHERE id = ?`, [id]);
    if (!tarea) return { ok: false, error: "Esa tarea ya no existe." };
    if (tarea.estado !== "pendiente") return { ok: false, error: "Esa tarea ya está cerrada." };

    const quien = (await sesionActual())?.sub ?? "";
    await db.run(
      `UPDATE tareas SET estado = 'sin_solucion', resueltaEn = datetime('now'), resueltaPor = ?, nota = ?
       WHERE id = ?`,
      [quien, nota.trim(), id],
    );

    revalidatePath("/admin/ia-assistant/tareas");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cerrar la tarea." };
  }
}

/** Cierra una tarea sin datos que completar: escalamiento o propuesta. */
export async function marcarHecha(id: number): Promise<Resultado> {
  try {
    const db = await getDB();
    const quien = (await sesionActual())?.sub ?? "";
    await db.run(
      `UPDATE tareas SET estado = 'resuelta', resueltaEn = datetime('now'), resueltaPor = ?
       WHERE id = ? AND estado = 'pendiente'`,
      [quien, id],
    );
    revalidatePath("/admin/ia-assistant/tareas");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cerrar la tarea." };
  }
}

/** Cuántas hay pendientes. Para el contador de la pestaña. */
export async function contarPendientes(): Promise<number> {
  try {
    const db = await getDB();
    const r = await db.get(`SELECT COUNT(*) AS n FROM tareas WHERE estado = 'pendiente'`);
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}
