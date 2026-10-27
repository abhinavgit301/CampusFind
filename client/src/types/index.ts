export type UserRole = 'STUDENT' | 'MODERATOR';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type HostelType = 'UNIWORLD_1' | 'UNIWORLD_2' | 'OTHER' | 'NONE';

export interface User {
  id: string;
  email: string;
  displayName: string;
  hostel?: HostelType;
  roomNumber?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt?: string;
}

export type ReportType = 'LOST' | 'FOUND';
export type HoldingLocation =
  | 'MACRO_RECEPTION'
  | 'UNIWORLD_1_RECEPTION'
  | 'UNIWORLD_2_RECEPTION'
  | 'WITH_FINDER';
export type ReportStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'RESOLVED' | 'WITHDRAWN' | 'EXPIRED';

export interface ContactDetails {
  displayName: string;
  phoneNumber: string;
  hostel?: string;
  roomNumber?: string;
}

export interface Report {
  _id: string;
  publicId: string;
  reportType: ReportType;
  reporterId: {
    _id: string;
    displayName: string;
    email?: string;
  } | string;
  categoryId: string;
  title: string;
  description: string;
  attributes?: Record<string, string>;
  photoKeys?: string[];
  photoUrls?: string[];
  eventAt: string;
  lastSeenLocation?: string;
  foundLocation?: string;
  holdingLocation?: HoldingLocation;
  contactDetails?: ContactDetails | null;
  status: ReportStatus;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus = 'PENDING' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Claim {
  _id: string;
  foundReportId: Report | string;
  claimantId: {
    _id: string;
    displayName: string;
    email?: string;
    phoneNumber?: string;
  } | string;
  answers: Record<string, string>;
  evidenceKeys: string[];
  status: ClaimStatus;
  reviewerId?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface MatchScoreBreakdown {
  category: number;
  description: number;
  location: number;
  time: number;
  attributes: number;
}

export interface Match {
  _id: string;
  lostReportId: Report;
  foundReportId: Report;
  score: number;
  scoreBreakdown: MatchScoreBreakdown;
  reasons: string[];
  status: 'SUGGESTED' | 'DISMISSED' | 'RESOLVED';
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedReportId?: {
    _id: string;
    publicId: string;
    title: string;
  };
  readAt?: string | null;
  createdAt: string;
}
