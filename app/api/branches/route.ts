import { NextResponse } from 'next/server';
import { fetchTabNames } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tabs = await fetchTabNames();
    return NextResponse.json(tabs);
  } catch (err) {
    console.error('[GET /api/branches]', err);
    return NextResponse.json({ error: 'Failed to fetch sheet tabs' }, { status: 500 });
  }
}
