import { assertValidStudioSeatUsername, isSeatUser } from './studio-seat.util';

describe('studio-seat.util', () => {
  it('normalizes and validates usernames', () => {
    expect(assertValidStudioSeatUsername('Sarah')).toBe('sarah');
    expect(assertValidStudioSeatUsername('a1')).toBe('a1');
  });

  it('rejects invalid usernames', () => {
    expect(() => assertValidStudioSeatUsername('a')).toThrow();
    expect(() => assertValidStudioSeatUsername('bad!name')).toThrow();
  });

  it('detects seat users without email', () => {
    expect(isSeatUser({})).toBe(true);
    expect(isSeatUser({ email: 'a@b.co' })).toBe(false);
  });
});
