// Client-safe config — NO spreadsheetIds here.
// Secrets live in lib/dashboard-secrets.ts.

export interface Dashboard {
  id: string;
  name: string;
}

// Dashboards — branches/tabs are fetched dynamically from Google Sheets.
// Adding a new spreadsheet tab requires no code change.
export const DASHBOARDS: Dashboard[] = [
  { id: 'meta-leads',    name: 'Meta Leads' },
  { id: 'website-leads', name: 'Website Leads' },
];

// ── Meta Leads column layout (0-based, A=0 … K=10) ──────────────────────────
// A=Date, B=Campaign, C=Name, D=Phone, E=Address,
// F=Plan Selected, G=Membership Selected, H=Primary Fitness Goal,
// I=Status, J=Remarks, K=Transfer To
export const META_COLUMNS = {
  createdTime:        0,  // A
  campaignName:       1,  // B
  fullName:           2,  // C
  phoneNumber:        3,  // D
  address:            4,  // E
  joiningPlan:        5,  // F
  membershipInterest: 6,  // G
  fitnessGoal:        7,  // H
  Status:             8,  // I
  Comments:           9,  // J
  transferTo:         10, // K
} as const;

export const META_DATA_RANGE = 'A2:K';

// ── Website Leads column layout (0-based, A=0 … I=8) ────────────────────────
// A=Date, B=Name, C=Phone, D=Email, E=Reason,
// F=Selected Branch, G=Status, H=Remarks, I=Transfer To
export const WEBSITE_COLUMNS = {
  createdTime: 0,  // A
  fullName:    1,  // B
  phoneNumber: 2,  // C
  email:       3,  // D
  reason:      4,  // E
  address:     5,  // F  (Selected Branch → address field)
  Status:      6,  // G
  Comments:    7,  // H
  transferTo:  8,  // I
} as const;

export const WEBSITE_DATA_RANGE = 'A2:I';
