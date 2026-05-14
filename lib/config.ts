// Client-safe config — NO spreadsheetIds here (env vars without NEXT_PUBLIC_ are
// undefined in the browser bundle). Secrets live in lib/dashboard-secrets.ts.
export interface DashboardBranch {
  id: string;
  name: string;
  sheetName: string;
}

export interface Dashboard {
  id: string;
  name: string;
  branches: DashboardBranch[];
}

export const DASHBOARDS: Dashboard[] = [
  {
    id: 'meta-leads',
    name: 'Meta Leads',
    branches: [
      { id: 'sec-69',        name: 'Sec 69',        sheetName: 'Sec 69' },
      { id: 'sec-57',        name: 'Sec 57',        sheetName: 'Sec 57' },
      { id: 'sec-83',        name: 'Sec 83',        sheetName: 'Sec 83' },
      { id: 'sec-104',       name: 'Sec 104',       sheetName: 'Sec 104' },
      { id: 'sec-37',        name: 'Sec 37',        sheetName: 'Sec 37' },
      { id: 'ramesh-ngr',    name: 'Ramesh Ngr',    sheetName: 'Ramesh Ngr' },
      { id: 'greater-noida', name: 'Greater Noida', sheetName: 'Greater Noida' },
    ],
  },
  {
    id: 'website-leads',
    name: 'Website Leads',
    branches: [
      { id: 'website-leads', name: 'Website Leads', sheetName: 'Sheet1' },
    ],
  },
];

// Column indices in the master spreadsheet (0-based, after the header row).
// Header row: Created Time | Campaign Name | Joining Plan | Membership Interest
//           | Full Name | Phone Number | Address | Status | Comments
export const SHEET_COLUMNS = {
  createdTime: 0,
  campaignName: 1,
  joiningPlan: 2,
  membershipInterest: 3,
  fullName: 4,
  phoneNumber: 5,
  address: 6,
  Status: 7,
  Comments: 8,
} as const;

// Range covers all 9 columns (A–I)
export const SHEET_DATA_RANGE = 'A2:I';

export const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Interested',
  'Not Interested',
  'Converted',
  'Follow Up',
] as const;

export const POLL_INTERVAL_MS =
  Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 15000;
