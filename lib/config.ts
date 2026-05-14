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
      { id: 'gurgaon-sector-69',  name: 'Gurgaon Sector 69',  sheetName: 'Gurgaon Sector 69' },
      { id: 'greater-noida',      name: 'Greater Noida',      sheetName: 'Greater Noida' },
      { id: 'gurgaon-sector-104', name: 'Gurgaon Sector 104', sheetName: 'Gurgaon Sector 104' },
      { id: 'ashok-vihar',        name: 'Ashok Vihar',        sheetName: 'Ashok Vihar' },
      { id: 'gurgaon-sector-7',   name: 'Gurgaon Sector 7',   sheetName: 'Gurgaon Sector 7' },
      { id: 'dehradun',           name: 'Dehradun',           sheetName: 'Dehradun' },
      { id: 'ramesh-nagar',       name: 'Ramesh Nagar',       sheetName: 'Ramesh Nagar' },
    ],
  },
];

// Meta Leads column layout (0-based):
// Created Time | Campaign Name | Joining Plan | Membership Interest
// | Full Name | Phone Number | Address | Status | Comments
export const META_SHEET_COLUMNS = {
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

// Keep SHEET_COLUMNS as an alias so nothing else breaks
export const SHEET_COLUMNS = META_SHEET_COLUMNS;

// Meta range: A–I (9 columns)
export const SHEET_DATA_RANGE = 'A2:I';

// Website Leads column layout (0-based):
// Date | First Name | Phone Number | Email Address | Reason | Status | Remarks | Transfer Branch
export const WEBSITE_SHEET_COLUMNS = {
  createdTime: 0,
  fullName: 1,
  phoneNumber: 2,
  email: 3,
  reason: 4,
  Status: 5,
  Comments: 6,
  branch: 7,
} as const;

// Website range: A–H (8 columns)
export const WEBSITE_DATA_RANGE = 'A2:H';

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
