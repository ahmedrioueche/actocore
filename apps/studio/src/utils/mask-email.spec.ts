import { describe, expect, it } from 'vitest';

import { maskEmail } from '@/utils/mask-email';

describe('maskEmail', () => {
  it('masks local part keeping first two characters', () => {
    expect(maskEmail('john@example.com')).toBe('jo***@example.com');
  });

  it('returns input unchanged when not a valid email shape', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });
});
