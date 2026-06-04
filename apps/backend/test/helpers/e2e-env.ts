/** Shared env defaults for e2e — avoids quota flags leaking across suites. */
export function applyDefaultE2eEnv(): void {
  process.env.NODE_ENV = 'test';
  process.env.QUOTA_ENFORCE = 'false';
  process.env.LLM_PROVIDER = 'stub';
  process.env.STUDIO_AUTH_DISABLED = 'true';
  delete process.env.REDIS_URL;
}

/** Sign up and return Bearer token for product-auth e2e suites. */
export async function studioSignupAndLogin(
  server: import('http').Server,
  username = `admin-${Date.now()}@test.local`,
): Promise<{ token: string; accountId: string }> {
  const res = await import('supertest')(server)
    .post('/v1/web/auth/signup')
    .send({
      accountName: 'E2E Account',
      username,
      password: 'password123',
    })
    .expect(201);

  return {
    token: res.body.data.accessToken as string,
    accountId: res.body.data.account.id as string,
  };
}

export function clearQuotaEnforceEnv(): void {
  delete process.env.QUOTA_ENFORCE;
  delete process.env.QUOTA_CHAT_PER_MINUTE;
  delete process.env.QUOTA_CHAT_PER_DAY;
  delete process.env.QUOTA_CHAT_PER_MONTH;
}
