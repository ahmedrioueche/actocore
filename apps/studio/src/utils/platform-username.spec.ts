import { describe, expect, it } from 'vitest';

import {
  isValidPlatformUsername,
  normalizePlatformUsername,
} from '@/utils/platform-username';

describe('platform-username', () => {
  it('normalizes to lowercase', () => {
    expect(normalizePlatformUsername(' Ops-Lead ')).toBe('ops-lead');
  });

  it('accepts valid usernames', () => {
    expect(isValidPlatformUsername('ops-lead')).toBe(true);
    expect(isValidPlatformUsername('ab')).toBe(true);
    expect(isValidPlatformUsername('user_1')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(isValidPlatformUsername('A')).toBe(false);
    expect(isValidPlatformUsername('bad name')).toBe(false);
    expect(isValidPlatformUsername('-start')).toBe(false);
    expect(isValidPlatformUsername('x')).toBe(false);
  });
});
