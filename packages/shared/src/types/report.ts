export const StudioReportType = {
  ISSUE: 'issue',
  FEEDBACK: 'feedback',
} as const;

export type StudioReportType =
  (typeof StudioReportType)[keyof typeof StudioReportType];

export const StudioReportStatus = {
  OPEN: 'open',
  RESOLVED: 'resolved',
} as const;

export type StudioReportStatus =
  (typeof StudioReportStatus)[keyof typeof StudioReportStatus];

export type StudioReportData = {
  id: string;
  accountId: string;
  accountName: string;
  reporterUserId: string;
  reporterEmail?: string;
  reporterDisplayName?: string;
  type: StudioReportType;
  subject?: string;
  message: string;
  status: StudioReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlatformReportListItem = StudioReportData;

export interface StudioReportRateLimitDetails {
  retryAfterSeconds: number;
}
