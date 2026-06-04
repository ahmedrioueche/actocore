import { percentile } from './percentile.util';

describe('percentile', () => {
  it('returns null for empty input', () => {
    expect(percentile([], 0.95)).toBeNull();
  });

  it('computes p95 for latency samples', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(values, 0.95)).toBe(95);
  });
});
