export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'Converted'
  | 'Follow Up';

export interface Lead {
  rowIndex: number;        // 1-based sheet row

  // Shared fields
  createdTime: string;     // col A (both dashboards)
  Status: LeadStatus | string;
  Comments: string;        // Remarks column
  transferTo: string;      // Transfer To column

  // Meta Leads fields
  campaignName: string;    // col B
  fullName: string;        // col C
  phoneNumber: string;     // col D
  address: string;         // col E (Address for meta / Selected Branch for website)
  joiningPlan: string;     // col F (Plan Selected)
  membershipInterest: string; // col G (Membership Selected)
  fitnessGoal: string;     // col H (Primary Fitness Goal) — meta only

  // Website Leads fields
  email: string;           // col D — website only
  reason: string;          // col E — website only
}

export interface StatsData {
  total: number;
  lastUpdated: Date | null;
}

export interface UpdatePayload {
  rowIndex: number;
  field: 'Status' | 'Comments';
  value: string;
  dashboardId: string;
  sheetName: string;
}

export interface TransferPayload {
  lead: Lead;
  targetSheetName: string;
  dashboardId: string;
  sourceSheetName: string;
}
