import { NextResponse } from 'next/server';
import { appendFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ip: ip.split(',')[0],
      path: body.path || '/',
      eventType: body.event || 'page_view', // page_view, click_cotizar
      duration: body.duration || 0
    };

    const dataDir = join(process.cwd(), 'data');
    const logPath = join(dataDir, 'analytics_log.jsonl');
    
    try { await access(dataDir); } catch { await mkdir(dataDir, { recursive: true }); }
    
    await appendFile(logPath, JSON.stringify(event) + '\n', 'utf8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
