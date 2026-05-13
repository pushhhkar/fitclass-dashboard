import { NextRequest, NextResponse } from 'next/server';
import { fetchLeads } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sheetName = req.nextUrl.searchParams.get('sheet');

  if (!sheetName) {
    return NextResponse.json({ error: 'sheet param is required' }, { status: 400 });
  }

  try {
    const leads = await fetchLeads(sheetName);
    return NextResponse.json(leads);
  } catch (err) {
    console.error('[GET /api/leads]', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
