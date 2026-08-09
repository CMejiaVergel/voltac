"use server";

import { getDB } from "../db";

/**
 * Consultas del panel de analítica.
 *
 * La versión anterior leía el archivo de eventos entero, lo parseaba línea por
 * línea y calculaba todo en JavaScript. Con unos miles de eventos eso ya se
 * notaba al abrir la pantalla. Aquí cada cifra sale de una consulta con índice,
 * y la tabla trae solo la página que se está mirando.
 */

export interface AnalyticsStats {
  uniqueVisitors: number;
  avgTimeSeconds: number;
  clicks: number;
  totalEvents: number;
}

export interface AnalyticsEvent {
  id: number;
  at: string;
  event: string;
  path: string | null;
  referrer: string | null;
  duration: number;
  userAgent: string | null;
}

export interface AnalyticsPayload {
  success: boolean;
  stats: AnalyticsStats;
  events: AnalyticsEvent[];
  topPaths: { path: string; vistas: number }[];
  porDia: { dia: string; vistas: number }[];
}

const VACIO: AnalyticsPayload = {
  success: false,
  stats: { uniqueVisitors: 0, avgTimeSeconds: 0, clicks: 0, totalEvents: 0 },
  events: [],
  topPaths: [],
  porDia: [],
};

export async function getAnalyticsData(dias = 30, limite = 200): Promise<AnalyticsPayload> {
  try {
    const db = await getDB();
    const desde = `-${Math.max(1, Math.min(dias, 365))} days`;

    const [visitantes, tiempo, clics, total] = await Promise.all([
      db.get(
        `SELECT COUNT(DISTINCT ipHash) c FROM analytics_events
         WHERE event = 'page_view' AND at >= datetime('now', ?)`, [desde]),
      db.get(
        `SELECT AVG(duration) c FROM analytics_events
         WHERE event = 'time_spent' AND duration > 0 AND at >= datetime('now', ?)`, [desde]),
      db.get(
        `SELECT COUNT(*) c FROM analytics_events
         WHERE event = 'click_cotizar' AND at >= datetime('now', ?)`, [desde]),
      db.get(
        `SELECT COUNT(*) c FROM analytics_events WHERE at >= datetime('now', ?)`, [desde]),
    ]);

    const topPaths = await db.all(
      `SELECT path, COUNT(*) vistas FROM analytics_events
       WHERE event = 'page_view' AND at >= datetime('now', ?)
       GROUP BY path ORDER BY vistas DESC LIMIT 10`, [desde]);

    const porDia = await db.all(
      `SELECT date(at) dia, COUNT(*) vistas FROM analytics_events
       WHERE event = 'page_view' AND at >= datetime('now', ?)
       GROUP BY dia ORDER BY dia`, [desde]);

    const events = await db.all(
      `SELECT id, at, event, path, referrer, duration, userAgent
       FROM analytics_events ORDER BY at DESC LIMIT ?`, [limite]);

    return {
      success: true,
      stats: {
        uniqueVisitors: visitantes?.c ?? 0,
        avgTimeSeconds: Math.round(tiempo?.c ?? 0),
        clicks: clics?.c ?? 0,
        totalEvents: total?.c ?? 0,
      },
      events: events as AnalyticsEvent[],
      topPaths: topPaths as { path: string; vistas: number }[],
      porDia: porDia as { dia: string; vistas: number }[],
    };
  } catch {
    return VACIO;
  }
}
