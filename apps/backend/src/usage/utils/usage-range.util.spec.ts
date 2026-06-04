import { parseUsageRangeQuery } from './usage-range.util';

describe('parseUsageRangeQuery', () => {
  it('parses valid ISO range', () => {
    const range = parseUsageRangeQuery('2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.999Z');
    expect(range.from?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(range.to).toBeInstanceOf(Date);
  });

  it('returns empty range when params omitted', () => {
    expect(parseUsageRangeQuery()).toEqual({});
  });
});
