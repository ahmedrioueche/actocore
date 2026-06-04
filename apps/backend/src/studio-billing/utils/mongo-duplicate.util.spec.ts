import { isMongoDuplicateKeyError } from './mongo-duplicate.util';

describe('isMongoDuplicateKeyError', () => {
  it('detects MongoDB duplicate key (11000)', () => {
    expect(isMongoDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isMongoDuplicateKeyError({ code: 1 })).toBe(false);
    expect(isMongoDuplicateKeyError(new Error('fail'))).toBe(false);
    expect(isMongoDuplicateKeyError(null)).toBe(false);
  });
});
