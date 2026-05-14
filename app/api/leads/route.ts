import { NextRequest, NextResponse } from 'next/server';
import { fetchLeads } from '@/lib/sheets';
import { getSpreadsheetId } from '@/lib/dashboard-secrets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dashboardId = req.nextUrl.searchParams.get('dashboardId');
  const sheetName   = req.nextUrl.searchParams.get('sheet');

  if (!dashboardId || !sheetName) {
    return NextResponse.json({ error: 'dashboardId and sheet params are required' }, { status: 400 });
  }

  try {
    const spreadsheetId = getSpreadsheetId(dashboardId);
    const leads = await fetchLeads(spreadsheetId, sheetName);
    return NextResponse.json(leads);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/leads] dashboardId=%s sheet=%s error=%s', dashboardId, sheetName, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
