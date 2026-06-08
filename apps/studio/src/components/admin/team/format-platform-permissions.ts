import type { PlatformPermission } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { PLATFORM_PERMISSION_LABEL_KEYS } from '@/components/admin/team/platform-manager-form';

export function formatPlatformPermissions(
  permissions: string[],
  t: TFunction,
): string {
  if (permissions.length === 0) {
    return '—';
  }

  return permissions
    .map((permission) => {
      const key =
        PLATFORM_PERMISSION_LABEL_KEYS[permission as PlatformPermission];
      return key ? t(key) : permission;
    })
    .join(', ');
}
