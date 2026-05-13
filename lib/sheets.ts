import { google } from 'googleapis';
import { SHEET_COLUMNS, SHEET_DATA_RANGE } from './config';
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

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SPREADSHEET_ID env variable is not set');
  return id;
}

export async function fetchTabNames(): Promise<string[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: 'sheets.properties.title',
  });
  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title ?? '')
    .filter(Boolean);
}

export async function fetchLeads(sheetName: string): Promise<Lead[]> {
  const sheets = getSheets();
  const range = `${sheetName}!${SHEET_DATA_RANGE}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range,
  });

  // Filter out empty rows — Sheets returns pre-allocated blank rows up to the grid size
  const rows = (res.data.values ?? []).filter((row) =>
    row.some((cell) => typeof cell === 'string' && cell.trim() !== '')
  );

  return rows.map((row, idx) => ({
    rowIndex: idx + 2, // +2: 1-based index + skip header row
    createdTime: row[SHEET_COLUMNS.createdTime] ?? '',
    campaignName: row[SHEET_COLUMNS.campaignName] ?? '',
    joiningPlan: row[SHEET_COLUMNS.joiningPlan] ?? '',
    membershipInterest: row[SHEET_COLUMNS.membershipInterest] ?? '',
    fullName: row[SHEET_COLUMNS.fullName] ?? '',
    phoneNumber: row[SHEET_COLUMNS.phoneNumber] ?? '',
    address: row[SHEET_COLUMNS.address] ?? '',
    Status: row[SHEET_COLUMNS.Status] ?? '',
    Comments: row[SHEET_COLUMNS.Comments] ?? '',
  }));
}

export async function updateCell(payload: UpdatePayload): Promise<void> {
  const sheets = getSheets();
  const colLetter =
    payload.field === 'Status'
      ? columnLetter(SHEET_COLUMNS.Status)
      : columnLetter(SHEET_COLUMNS.Comments);

  const range = `${payload.sheetName}!${colLetter}${payload.rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
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
