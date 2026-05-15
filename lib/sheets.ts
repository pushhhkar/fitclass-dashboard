import { google } from 'googleapis';
import {
  META_COLUMNS, META_DATA_RANGE,
  WEBSITE_COLUMNS, WEBSITE_DATA_RANGE,
} from './config';
import type { Lead, UpdatePayload, TransferPayload } from '@/types';

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

// Wraps a sheet name in single quotes and escapes embedded single quotes.
function sheetRange(name: string, suffix: string): string {
  const escaped = name.replace(/'/g, "\\'");
  return `'${escaped}'!${suffix}`;
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

// ── Tab discovery ─────────────────────────────────────────────────────────────
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

// ── Fetch leads ───────────────────────────────────────────────────────────────
export async function fetchLeads(
  spreadsheetId: string,
  sheetName: string,
  dashboardId: string
): Promise<Lead[]> {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  const sheets = getSheets();

  const isWebsite = dashboardId === 'website-leads';
  const dataRange = isWebsite ? WEBSITE_DATA_RANGE : META_DATA_RANGE;
  const range = sheetRange(sheetName, dataRange);

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  const rows = (res.data.values ?? []).filter((row) =>
    row.some((cell) => typeof cell === 'string' && cell.trim() !== '')
  );

  if (isWebsite) {
    const C = WEBSITE_COLUMNS;
    return rows.map((row, idx) => ({
      rowIndex:           idx + 2,
      createdTime:        row[C.createdTime]  ?? '',
      fullName:           row[C.fullName]     ?? '',
      phoneNumber:        row[C.phoneNumber]  ?? '',
      email:              row[C.email]        ?? '',
      reason:             row[C.reason]       ?? '',
      address:            row[C.address]      ?? '',  // Selected Branch
      Status:             row[C.Status]       ?? '',
      Comments:           row[C.Comments]     ?? '',
      transferTo:         row[C.transferTo]   ?? '',
      // Unused meta fields
      campaignName:       '',
      joiningPlan:        row[C.reason]       ?? '',
      membershipInterest: '',
      fitnessGoal:        '',
    }));
  }

  const C = META_COLUMNS;
  return rows.map((row, idx) => ({
    rowIndex:           idx + 2,
    createdTime:        row[C.createdTime]        ?? '',
    campaignName:       row[C.campaignName]       ?? '',
    fullName:           row[C.fullName]           ?? '',
    phoneNumber:        row[C.phoneNumber]        ?? '',
    address:            row[C.address]            ?? '',
    joiningPlan:        row[C.joiningPlan]        ?? '',
    membershipInterest: row[C.membershipInterest] ?? '',
    fitnessGoal:        row[C.fitnessGoal]        ?? '',
    Status:             row[C.Status]             ?? '',
    Comments:           row[C.Comments]           ?? '',
    transferTo:         row[C.transferTo]         ?? '',
    // Unused website fields
    email:  '',
    reason: '',
  }));
}

// ── Update Status or Comments cell ───────────────────────────────────────────
export async function updateCell(
  payload: UpdatePayload & { spreadsheetId: string }
): Promise<void> {
  const sheets = getSheets();
  const isWebsite = payload.dashboardId === 'website-leads';
  const cols = isWebsite ? WEBSITE_COLUMNS : META_COLUMNS;

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

// ── Transfer lead to another sheet tab ───────────────────────────────────────
// Appends the lead row to the target sheet and writes the target name into
// the "Transfer To" column of the source row.
export async function transferLead(
  payload: TransferPayload & { spreadsheetId: string }
): Promise<void> {
  const sheets = getSheets();
  const { lead, targetSheetName, sourceSheetName, spreadsheetId, dashboardId } = payload;
  const isWebsite = dashboardId === 'website-leads';

  // Build the row array in the correct column order for the target sheet
  let newRow: string[];
  if (isWebsite) {
    const C = WEBSITE_COLUMNS;
    newRow = Array(Object.keys(C).length).fill('');
    newRow[C.createdTime]  = lead.createdTime;
    newRow[C.fullName]     = lead.fullName;
    newRow[C.phoneNumber]  = lead.phoneNumber;
    newRow[C.email]        = lead.email;
    newRow[C.reason]       = lead.reason;
    newRow[C.address]      = lead.address;
    newRow[C.Status]       = lead.Status;
    newRow[C.Comments]     = lead.Comments;
    newRow[C.transferTo]   = '';
  } else {
    const C = META_COLUMNS;
    newRow = Array(Object.keys(C).length).fill('');
    newRow[C.createdTime]        = lead.createdTime;
    newRow[C.campaignName]       = lead.campaignName;
    newRow[C.fullName]           = lead.fullName;
    newRow[C.phoneNumber]        = lead.phoneNumber;
    newRow[C.address]            = lead.address;
    newRow[C.joiningPlan]        = lead.joiningPlan;
    newRow[C.membershipInterest] = lead.membershipInterest;
    newRow[C.fitnessGoal]        = lead.fitnessGoal;
    newRow[C.Status]             = lead.Status;
    newRow[C.Comments]           = lead.Comments;
    newRow[C.transferTo]         = '';
  }

  // 1. Append to target sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange(targetSheetName, 'A1'),
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [newRow] },
  });

  // 2. Write target name into Transfer To column of source row
  const cols = isWebsite ? WEBSITE_COLUMNS : META_COLUMNS;
  const transferColLetter = columnLetter(cols.transferTo);
  const sourceRange = sheetRange(sourceSheetName, `${transferColLetter}${lead.rowIndex}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sourceRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[targetSheetName]] },
  });
}
