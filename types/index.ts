export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'Converted'
  | 'Follow Up';

export interface Lead {
  rowIndex: number; // 1-based sheet row
  createdTime: string;
  campaignName: string;
  joiningPlan: string;
  membershipInterest: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  Status: LeadStatus | string;
  Comments: string;
}

// A tab inside the single master spreadsheet
export interface Branch {
  sheetName: string; // tab title — used as both the display label and the API key
}

export interface StatsData {
  total: number;
}

export interface UpdatePayload {
  rowIndex: number;
  field: 'Status' | 'Comments';
  value: string;
  dashboardId: string;
  sheetName: string;
}
