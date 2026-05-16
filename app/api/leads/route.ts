import { NextRequest, NextResponse } from 'next/server';
import { fetchLeads, fetchSheetHeaders, fetchStatusOptions } from '@/lib/sheets';
import { getSpreadsheetId } from '@/lib/dashboard-secrets';
import { META_COLUMNS, WEBSITE_COLUMNS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dashboardId = req.nextUrl.searchParams.get('dashboardId');
  const sheetName   = req.nextUrl.searchParams.get('sheet');

  if (!dashboardId || !sheetName) {
    return NextResponse.json({ error: 'dashboardId and sheet params are required' }, { status: 400 });
  }

  try {
    const spreadsheetId = getSpreadsheetId(dashboardId);
    const isWebsite = dashboardId === 'website-leads';
    const statusColIndex = isWebsite ? WEBSITE_COLUMNS.Status : META_COLUMNS.Status;

    const [leads, headers, statusOptions] = await Promise.all([
      fetchLeads(spreadsheetId, sheetName, dashboardId),
      isWebsite ? fetchSheetHeaders(spreadsheetId, sheetName) : Promise.resolve([] as string[]),
      fetchStatusOptions(spreadsheetId, sheetName, statusColIndex),
    ]);

    return NextResponse.json({ leads, headers, statusOptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/leads] dashboardId=%s sheet=%s error=%s', dashboardId, sheetName, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
