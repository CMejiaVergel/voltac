import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const accounts = await db.all('SELECT * FROM acc_accounts WHERE is_active = 1 ORDER BY code ASC');
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error fetching accounts' }, { status: 500 });
  }
}
