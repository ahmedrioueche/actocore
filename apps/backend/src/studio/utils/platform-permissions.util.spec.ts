import 'reflect-metadata';
import { PlatformPermission } from '@ahmedrioueche/actocore-shared';
import { resolvePlatformPermissionsForMembership } from './platform-permissions.util';

describe('resolvePlatformPermissionsForMembership', () => {
  it('grants all permissions to master user', () => {
    const perms = resolvePlatformPermissionsForMembership(
      { isPlatformMaster: true } as never,
      { permissions: [] } as never,
    );
    expect(perms).toContain(PlatformPermission.PLANS_WRITE);
  });

  it('uses membership overrides for managers', () => {
    const perms = resolvePlatformPermissionsForMembership(
      { isPlatformMaster: false } as never,
      {
        permissions: [PlatformPermission.ACCOUNTS_READ],
      } as never,
    );
    expect(perms).toEqual([PlatformPermission.ACCOUNTS_READ]);
  });
});
