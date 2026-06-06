import { resolveStudioAuthConfig } from './studio-auth.config';

describe('studio-auth.config', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.STUDIO_AUTH_DISABLED;
    delete process.env.STUDIO_JWT_SECRET;
    delete process.env.STUDIO_JWT_REFRESH_SECRET;
    delete process.env.STUDIO_PASSWORD_PEPPER;
  });

  afterAll(() => {
    process.env = env;
  });

  it('is disabled in test by default', () => {
    process.env.NODE_ENV = 'test';
    expect(resolveStudioAuthConfig().disabled).toBe(true);
  });

  it('can force enable in test', () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    const config = resolveStudioAuthConfig();
    expect(config.disabled).toBe(false);
  });

  it('requires secrets in production when enabled', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveStudioAuthConfig()).toThrow(/STUDIO_JWT_SECRET/);
  });

  it('uses RESEND_EMAIL_FROM when STUDIO_EMAIL_FROM is unset', () => {
    process.env.NODE_ENV = 'development';
    process.env.RESEND_EMAIL_FROM = 'noreply@actocore.pro';
    delete process.env.STUDIO_EMAIL_FROM;
    const config = resolveStudioAuthConfig();
    expect(config.emailFrom).toBe('ActoCore Studio <noreply@actocore.pro>');
    delete process.env.RESEND_EMAIL_FROM;
  });
});
