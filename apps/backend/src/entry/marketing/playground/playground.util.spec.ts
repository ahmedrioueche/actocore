import {
  createPlaygroundToken,
  verifyPlaygroundToken,
} from './playground-token.util';
import {
  decryptPlaygroundSecret,
  encryptPlaygroundSecret,
} from './playground-crypto.util';

describe('playground-token.util', () => {
  const secret = 'test-playground-secret';

  it('creates and verifies a playground token', () => {
    const token = createPlaygroundToken(
      { visitorId: 'visitor-1', projectId: 'project-1' },
      secret,
      7,
    );

    expect(token.startsWith('pg_')).toBe(true);
    expect(verifyPlaygroundToken(token, secret)).toEqual({
      visitorId: 'visitor-1',
      projectId: 'project-1',
      exp: expect.any(Number),
    });
  });
});

describe('playground-crypto.util', () => {
  it('encrypts and decrypts api keys', () => {
    const secret = 'another-secret-key-value';
    const ciphertext = encryptPlaygroundSecret('ak_live_test_key', secret);
    expect(decryptPlaygroundSecret(ciphertext, secret)).toBe('ak_live_test_key');
  });
});
