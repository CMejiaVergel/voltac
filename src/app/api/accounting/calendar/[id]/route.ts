import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const db = await getDB();
    await db.run('DELETE FROM acc_calendar_events WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}
