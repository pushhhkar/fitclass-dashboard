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
