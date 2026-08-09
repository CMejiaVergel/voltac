import { NextResponse } from "next/server";
import { getDB } from "../db";
import { sha256Hex } from "../auth";

/**
 * Recolección de eventos de navegación.
 *
 * Antes se escribía cada evento como una línea en `data/analytics_log.jsonl`,
 * relativo a `process.cwd()`. Eso tenía tres problemas: dejó de funcionar al
 * cambiar el directorio de trabajo con el monorepo, el archivo crecía sin
 * límite y se leía entero en memoria para pintar el panel, y no entraba en los
 * respaldos. Ahora los eventos van a la base operativa de cada marca, que sí
 * se respalda y se consulta con índices.
 *
 * **Sobre la IP.** No se guarda en claro. Se guarda un hash con sal del
 * servidor, que permite contar visitantes distintos sin conservar un dato
 * personal identificable. Es lo coherente con la política de privacidad que
 * publicamos: recolectamos la IP con fines estadísticos, no para perfilar.
 */

const EVENTOS_VALIDOS = new Set(["page_view", "time_spent", "click_cotizar"]);

/** Ventana de retención. Pasado ese plazo el evento deja de tener valor. */
const RETENCION_DIAS = 180;

async function hashIp(ip: string): Promise<string> {
  const sal = process.env.ADMIN_SESSION_SECRET ?? "voltac";
  return (await sha256Hex(`${sal}:${ip}`)).slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const evento = String(body.event ?? "page_view");
    if (!EVENTOS_VALIDOS.has(evento)) {
      return NextResponse.json({ success: false, error: "Evento no reconocido" }, { status: 400 });
    }

    const reenviada = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
    const ip = reenviada.split(",")[0].trim() || "desconocida";

    const db = await getDB();
    await db.run(
      `INSERT INTO analytics_events (event, path, ipHash, userAgent, referrer, duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        evento,
        String(body.path ?? "/").slice(0, 300),
        await hashIp(ip),
        (req.headers.get("user-agent") ?? "").slice(0, 300),
        String(body.referrer ?? "").slice(0, 300),
        Math.max(0, Math.min(Number(body.duration) || 0, 86_400)),
      ],
    );

    /* Poda ocasional (1 de cada 200 peticiones): mantiene la tabla acotada sin
       necesidad de una tarea programada aparte. */
    if (Math.random() < 0.005) {
      await db.run(`DELETE FROM analytics_events WHERE at < datetime('now', ?)`, [
        `-${RETENCION_DIAS} days`,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    // Un fallo de analítica no debe romper la navegación de nadie.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
