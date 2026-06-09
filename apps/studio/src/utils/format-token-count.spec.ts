import { describe, expect, it } from 'vitest';

import { formatTokenCount } from './format-token-count';

describe('formatTokenCount', () => {
  it('formats token counts compactly', () => {
    expect(formatTokenCount(500)).toBe('500');
    expect(formatTokenCount(500_000)).toBe('500K');
    expect(formatTokenCount(5_000_000)).toBe('5M');
    expect(formatTokenCount(50_000_000)).toBe('50M');
  });
});
