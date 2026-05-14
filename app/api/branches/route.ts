import { NextRequest, NextResponse } from 'next/server';
import { fetchTabNames } from '@/lib/sheets';
import { getSpreadsheetId } from '@/lib/dashboard-secrets';
import { DASHBOARDS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dashboardId = req.nextUrl.searchParams.get('dashboardId');

  if (!dashboardId) {
    return NextResponse.json({ error: 'dashboardId param is required' }, { status: 400 });
  }

  try {
    const spreadsheetId = getSpreadsheetId(dashboardId);
    const realTabs = await fetchTabNames(spreadsheetId);

    const dashboard = DASHBOARDS.find((d) => d.id === dashboardId);
    const configuredNames = dashboard?.branches.map((b) => b.sheetName) ?? [];

    const mismatches = configuredNames.filter((name) => !realTabs.includes(name));

    console.log('[/api/branches] dashboardId=%s', dashboardId);
    console.log('[/api/branches] real tabs from Google:', JSON.stringify(realTabs));
    console.log('[/api/branches] configured sheetNames:', JSON.stringify(configuredNames));
    if (mismatches.length) {
      console.warn('[/api/branches] MISMATCHES (configured but not in sheet):', JSON.stringify(mismatches));
    }

    return NextResponse.json({ realTabs, configuredNames, mismatches });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/branches]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
