import {
  resolvePlatformPermissions,
  type PlatformPermission,
} from '@ahmedrioueche/actocore-shared';
import type { StudioMembershipDocument } from '../schemas/studio-membership.schema';
import type { StudioUserDocument } from '../schemas/studio-user.schema';

export function resolvePlatformPermissionsForMembership(
  user: StudioUserDocument,
  membership: StudioMembershipDocument,
): PlatformPermission[] {
  return resolvePlatformPermissions(
    Boolean(user.isPlatformMaster),
    membership.permissions,
  );
}
