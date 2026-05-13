import { NextRequest, NextResponse } from 'next/server';
import { updateCell } from '@/lib/sheets';
import type { UpdatePayload } from '@/types';

export async function PATCH(req: NextRequest) {
  let body: UpdatePayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { rowIndex, field, value, sheetName } = body;

  if (!rowIndex || !field || value === undefined || !sheetName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (field !== 'Status' && field !== 'Comments') {
    return NextResponse.json({ error: 'field must be Status or Comments' }, { status: 400 });
  }

  try {
    await updateCell({ rowIndex, field, value, sheetName });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/sheets]', err);
    return NextResponse.json({ error: 'Failed to update sheet' }, { status: 500 });
  }
}
