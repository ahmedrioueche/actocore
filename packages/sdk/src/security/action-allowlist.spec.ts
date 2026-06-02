import { describe, expect, it } from 'vitest';
import { isActionAllowed, shouldBlockAction } from './action-allowlist';

const baseSecurity = {
  allowedActionNames: undefined,
  enforceActionAllowlist: false,
  hostContext: undefined,
};

describe('action allowlist', () => {
  it('allows everything when no allowlist is configured', () => {
    expect(isActionAllowed('deploy', baseSecurity)).toBe(true);
    expect(shouldBlockAction('deploy', baseSecurity)).toBe(false);
  });

  it('allows only listed actions when enforcement is on', () => {
    const security = {
      ...baseSecurity,
      allowedActionNames: ['deploy'],
      enforceActionAllowlist: true,
    };

    expect(isActionAllowed('deploy', security)).toBe(true);
    expect(isActionAllowed('delete_project', security)).toBe(false);
    expect(shouldBlockAction('deploy', security)).toBe(false);
    expect(shouldBlockAction('delete_project', security)).toBe(true);
  });

  it('does not block when list exists but enforcement is disabled', () => {
    const security = {
      ...baseSecurity,
      allowedActionNames: ['deploy'],
      enforceActionAllowlist: false,
    };

    expect(shouldBlockAction('delete_project', security)).toBe(false);
  });
});

