import { shouldSeedStudioTestAccounts } from './studio-test-accounts.seed.util';

describe('shouldSeedStudioTestAccounts', () => {
  const originalFlag = process.env.STUDIO_FEATURE_TEST_ACCOUNTS;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.STUDIO_FEATURE_TEST_ACCOUNTS;
    } else {
      process.env.STUDIO_FEATURE_TEST_ACCOUNTS = originalFlag;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('defaults to enabled in development when unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.STUDIO_FEATURE_TEST_ACCOUNTS;
    expect(shouldSeedStudioTestAccounts()).toBe(true);
  });

  it('respects explicit overrides', () => {
    process.env.NODE_ENV = 'development';
    process.env.STUDIO_FEATURE_TEST_ACCOUNTS = 'false';
    expect(shouldSeedStudioTestAccounts()).toBe(false);

    process.env.STUDIO_FEATURE_TEST_ACCOUNTS = 'true';
    expect(shouldSeedStudioTestAccounts()).toBe(true);
  });

  it('defaults to disabled outside development when unset', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STUDIO_FEATURE_TEST_ACCOUNTS;
    expect(shouldSeedStudioTestAccounts()).toBe(false);
  });
});
