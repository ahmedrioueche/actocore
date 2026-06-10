import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { describe, expect, it } from 'vitest';

import {
  isPlatformOperatorRole,
  isPlatformOperatorSession,
  PLATFORM_CONSOLE_HOME,
  TENANT_WORKSPACE_HOME,
} from '@/lib/tenant-workspace';

describe('tenant-workspace access', () => {
  it('identifies super admin as a platform operator', () => {
    expect(isPlatformOperatorRole(StudioRole.SUPER_ADMIN)).toBe(true);
    expect(isPlatformOperatorRole(StudioRole.USER_ADMIN)).toBe(false);
    expect(isPlatformOperatorRole(StudioRole.USER_EDITOR)).toBe(false);
  });

  it('detects platform operator sessions', () => {
    expect(
      isPlatformOperatorSession({ role: StudioRole.SUPER_ADMIN }),
    ).toBe(true);
    expect(
      isPlatformOperatorSession({ role: StudioRole.USER_ADMIN }),
    ).toBe(false);
  });

  it('exposes stable home paths', () => {
    expect(TENANT_WORKSPACE_HOME).toBe('/projects');
    expect(PLATFORM_CONSOLE_HOME).toBe('/admin');
  });
});
