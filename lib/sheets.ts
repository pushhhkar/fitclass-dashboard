import { google } from 'googleapis';
import {
  SHEET_COLUMNS, SHEET_DATA_RANGE,
  WEBSITE_SHEET_COLUMNS, WEBSITE_DATA_RANGE,
} from './config';
import type { Lead, UpdatePayload } from '@/types';

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env variable is not set');
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export async function fetchTabNames(spreadsheetId: string): Promise<string[]> {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  const sheets = getSheets();
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title ?? '')
    .filter(Boolean);
}

// Wraps a sheet name in single quotes and escapes any embedded single quotes.
// Required by the Sheets API for tab names containing spaces or special chars.
function sheetRange(name: string, suffix: string): string {
  const escaped = name.replace(/'/g, "\\'");
  const range = `'${escaped}'!${suffix}`;
  console.log('[sheets] range:', range);
  return range;
}

export async function fetchLeads(
  spreadsheetId: string,
  sheetName: string,
  dashboardId: string
): Promise<Lead[]> {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  const sheets = getSheets();

  const isWebsite = dashboardId === 'website-leads';
  const dataRange = isWebsite ? WEBSITE_DATA_RANGE : SHEET_DATA_RANGE;
  const range = sheetRange(sheetName, dataRange);

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  // Filter out empty rows — Sheets returns pre-allocated blank rows up to the grid size
  const rows = (res.data.values ?? []).filter((row) =>
    row.some((cell) => typeof cell === 'string' && cell.trim() !== '')
  );

  if (isWebsite) {
    const C = WEBSITE_SHEET_COLUMNS;
    return rows.map((row, idx) => {
      const reason = row[C.reason] ?? '';
      return {
        rowIndex: idx + 2,
        createdTime: row[C.createdTime] ?? '',
        campaignName: '',
        joiningPlan: reason,
        membershipInterest: reason,
        fullName: row[C.fullName] ?? '',
        phoneNumber: row[C.phoneNumber] ?? '',
        email: row[C.email] ?? '',
        address: row[C.branch] ?? '',
        Status: row[C.Status] ?? '',
        Comments: row[C.Comments] ?? '',
      };
    });
  }

  const C = SHEET_COLUMNS;
  return rows.map((row, idx) => ({
    rowIndex: idx + 2,
    createdTime: row[C.createdTime] ?? '',
    campaignName: row[C.campaignName] ?? '',
    joiningPlan: row[C.joiningPlan] ?? '',
    membershipInterest: row[C.membershipInterest] ?? '',
    fullName: row[C.fullName] ?? '',
    phoneNumber: row[C.phoneNumber] ?? '',
    email: '',
    address: row[C.address] ?? '',
    Status: row[C.Status] ?? '',
    Comments: row[C.Comments] ?? '',
  }));
}

export async function updateCell(
  payload: UpdatePayload & { spreadsheetId: string }
): Promise<void> {
  const sheets = getSheets();

  const isWebsite = payload.dashboardId === 'website-leads';
  const cols = isWebsite ? WEBSITE_SHEET_COLUMNS : SHEET_COLUMNS;
  const colLetter =
    payload.field === 'Status'
      ? columnLetter(cols.Status)
      : columnLetter(cols.Comments);

  const range = sheetRange(payload.sheetName, `${colLetter}${payload.rowIndex}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: payload.spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[payload.value]] },
  });
}

function columnLetter(index: number): string {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}
