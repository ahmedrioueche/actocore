import type { StudioRole } from '../constants/studio-permissions';

export interface StudioAccountData {
  id: string;
  name: string;
  billingEmail?: string;
  timezone?: string;
  defaultLocale?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioUserData {
  id: string;
  /** Present for workspace owner/admin; seat editors use `username` only. */
  email?: string;
  /** Workspace seat login name (editors). */
  username?: string;
  displayName?: string;
  emailVerified: boolean;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioMemberData {
  userId: string;
  /** Seat login name for editors. */
  username?: string;
  /** Owner/admin email when set. */
  email?: string;
  displayName?: string;
  role: StudioRole;
  permissions: string[];
  projectIds: string[];
  createdAt: string;
}

export interface StudioAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StudioSessionData extends StudioAuthTokens {
  user: StudioUserData;
  account: StudioAccountData;
  role: StudioRole;
  permissions: string[];
  projectIds: string[];
}

export interface StudioSignupResultData {
  message: string;
  email: string;
  /** Present when `STUDIO_DEFAULT_PROJECT_ON_SIGNUP` is enabled (default). */
  defaultProjectId?: string;
  /** Non-production only: verification link when SMTP is not configured. */
  devVerificationUrl?: string;
}

export type StudioTeamAuditAction =
  | 'seat.created'
  | 'seat.updated'
  | 'seat.removed';

export interface StudioTeamAuditEntryData {
  id: string;
  accountId: string;
  action: StudioTeamAuditAction;
  targetUserId: string;
  actorUserId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface StudioAuthMeData {
  user: StudioUserData;
  account: StudioAccountData;
  role: StudioRole;
  permissions: string[];
  projectIds: string[];
}

export interface StudioGoogleAuthUrlData {
  authUrl: string;
}

export interface StudioRefreshResultData {
  accessToken: string;
}

export interface StudioMessageData {
  message: string;
  /** Non-production only: action link when SMTP is not configured. */
  devVerificationUrl?: string;
}

export interface PlatformAccountListItemData {
  id: string;
  name: string;
  billingEmail?: string;
  planId?: string;
  paddleCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}
