import { SetMetadata } from '@nestjs/common';
import type { PlatformPermission } from '@ahmedrioueche/actocore-shared';

export const PLATFORM_PERMISSION_KEY = 'platform_permission';

export const RequirePlatformPermission = (...permissions: PlatformPermission[]) =>
  SetMetadata(PLATFORM_PERMISSION_KEY, permissions);
