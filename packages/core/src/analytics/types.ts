/**
 * Formas de los datos de analítica.
 *
 * Viven aparte de `queries.ts` porque ese archivo lleva `"use server"` y lo
 * consumen también componentes de cliente. Un archivo de tipos sin directiva se
 * puede importar desde cualquier lado sin arrastrar nada al navegador.
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
