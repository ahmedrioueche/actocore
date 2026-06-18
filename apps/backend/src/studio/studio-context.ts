import type { StudioRole } from '@ahmedrioueche/actocore-shared';

/** Resolved Studio identity attached to each authenticated `/web/*` request. */
export type StudioRequestContext = {
  userId: string;
  accountId: string;
  email?: string;
  username?: string;
  role: StudioRole;
  permissions: string[];
  projectIds: string[];
  /** JWT `tal` claim — present for shared demo account sessions. */
  testAccountLeaseId?: string;
};
