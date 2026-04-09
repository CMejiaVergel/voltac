"use server";

import { readFile } from 'fs/promises';
import { join } from 'path';

export async function getAnalyticsData() {
  try {
    const logPath = join(process.cwd(), 'data', 'analytics_log.jsonl');
    const content = await readFile(logPath, 'utf8');
    
    const lines = content.trim().split('\n');
    const events = lines.filter(l => l).map(line => JSON.parse(line));
    
    // Calcular métricas
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const timeSpentEvents = events.filter(e => e.eventType === 'time_spent');
    const clicksCotizar = events.filter(e => e.eventType === 'click_cotizar');

    const uniqueIps = new Set(pageViews.map(e => e.ip)).size;
    
    const totalDuration = timeSpentEvents.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const avgDurationSeconds = timeSpentEvents.length ? Math.floor(totalDuration / timeSpentEvents.length) : 0;
    
    // Tabla cruda interactiva
    const rawEvents = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 1000); // mostrar ultimos 1000

    return {
      success: true,
      stats: {
        uniqueVisitors: uniqueIps,
        avgTimeSeconds: avgDurationSeconds,
        clicks: clicksCotizar.length,
        totalEvents: events.length
      },
      events: rawEvents
    };
  } catch (err) {
    return { success: false, stats: { uniqueVisitors: 0, avgTimeSeconds: 0, clicks: 0, totalEvents: 0 }, events: [] };
  }
}
