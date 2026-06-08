import type { PlatformPermission } from '../constants/platform-permissions';
import type { StudioAuthTokens, StudioUserData } from './studio';

export interface PlatformAuthMeData {
  user: StudioUserData;
  platformAccountId: string;
  isPlatformMaster: boolean;
  platformPermissions: PlatformPermission[];
}

export interface PlatformSessionData extends StudioAuthTokens, PlatformAuthMeData {}

export interface PlatformManagerData {
  userId: string;
  username: string;
  displayName?: string;
  isMaster: boolean;
  permissions: PlatformPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSubscriptionListItem {
  id: string;
  accountId: string;
  accountName: string;
  planId: string;
  status: string;
  provider: string;
  billingCycle?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
}

export interface PlatformUserListItem {
  id: string;
  email?: string;
  platformLoginName?: string;
  displayName?: string;
  membershipCount: number;
  createdAt: string;
}

export interface PlatformProjectListItem {
  id: string;
  accountId: string;
  accountName: string;
  name: string;
  archived: boolean;
  createdAt: string;
}

export interface PlatformAnalyticsOverview {
  totalAccounts: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  estimatedMrr: number;
  totalProjects: number;
  monthlyChatRequests: number;
}
