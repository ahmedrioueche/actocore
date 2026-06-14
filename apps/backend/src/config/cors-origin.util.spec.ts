import {
  inferActocoreOriginPattern,
  isCorsOriginAllowed,
  matchesCorsOriginPattern,
} from './cors-origin.util';

describe('cors-origin.util', () => {
  describe('matchesCorsOriginPattern', () => {
    it('matches actocore.pro subdomains with *.actocore.pro', () => {
      expect(
        matchesCorsOriginPattern('https://staging.actocore.pro', '*.actocore.pro'),
      ).toBe(true);
      expect(
        matchesCorsOriginPattern('https://www.actocore.pro', '*.actocore.pro'),
      ).toBe(true);
      expect(
        matchesCorsOriginPattern('https://actocore.pro', '*.actocore.pro'),
      ).toBe(true);
    });

    it('rejects unrelated hostnames', () => {
      expect(
        matchesCorsOriginPattern('https://evil.com', '*.actocore.pro'),
      ).toBe(false);
      expect(
        matchesCorsOriginPattern(
          'https://notactocore.pro',
          '*.actocore.pro',
        ),
      ).toBe(false);
      expect(
        matchesCorsOriginPattern(
          'https://actocore.pro.evil.com',
          '*.actocore.pro',
        ),
      ).toBe(false);
    });

    it('supports full-origin protocol patterns', () => {
      expect(
        matchesCorsOriginPattern(
          'https://staging.actocore.pro',
          'https://*.actocore.pro',
        ),
      ).toBe(true);
      expect(
        matchesCorsOriginPattern(
          'http://staging.actocore.pro',
          'https://*.actocore.pro',
        ),
      ).toBe(false);
    });
  });

  describe('isCorsOriginAllowed', () => {
    it('accepts exact origins and wildcard patterns', () => {
      expect(
        isCorsOriginAllowed(
          'http://localhost:5174',
          ['http://localhost:5174'],
          ['*.actocore.pro'],
        ),
      ).toBe(true);
      expect(
        isCorsOriginAllowed(
          'https://staging.actocore.pro',
          ['https://www.actocore.pro'],
          ['*.actocore.pro'],
        ),
      ).toBe(true);
    });
  });

  describe('inferActocoreOriginPattern', () => {
    it('returns *.actocore.pro for studio URLs on that domain', () => {
      expect(inferActocoreOriginPattern('https://www.actocore.pro')).toBe(
        '*.actocore.pro',
      );
      expect(inferActocoreOriginPattern('https://staging.actocore.pro')).toBe(
        '*.actocore.pro',
      );
    });

    it('returns undefined for other domains', () => {
      expect(inferActocoreOriginPattern('http://localhost:5173')).toBeUndefined();
    });
  });
});
