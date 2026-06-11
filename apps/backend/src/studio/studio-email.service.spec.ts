import { ConfigService } from '@nestjs/config';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { StudioEmailService } from './studio-email.service';

describe('StudioEmailService', () => {
  const baseCfg: StudioAuthConfig = {
    disabled: false,
    jwtSecret: 'secret',
    jwtRefreshSecret: 'refresh',
    jwtAccessExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    passwordPepper: 'pepper',
    studioAppUrl: 'http://localhost:5173',
    googleClientId: null,
    googleClientSecret: null,
    googleRedirectUri: null,
    emailFrom: 'ActoCore <noreply@actocore.pro>',
    resendApiKey: null,
    smtpHost: null,
    smtpPort: 587,
    smtpUser: null,
    smtpPass: null,
    defaultProjectOnSignup: true,
    defaultProjectName: 'My project',
  };

  function createService(cfg: Partial<StudioAuthConfig>): StudioEmailService {
    const config = {
      getOrThrow: () => ({ ...baseCfg, ...cfg }),
    } as unknown as ConfigService;
    return new StudioEmailService(config);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('isEmailConfigured is true when Resend API key is set', () => {
    const service = createService({ resendApiKey: 're_test' });
    expect(service.isEmailConfigured()).toBe(true);
  });

  it('sends via Resend HTTP API when RESEND_API_KEY is configured', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '',
    } as Response);

    const service = createService({ resendApiKey: 're_test_key' });
    await service.sendVerificationEmail('user@example.com', 'abc123');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
        }),
      }),
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.from).toBe('ActoCore <noreply@actocore.pro>');
    expect(body.to).toEqual(['user@example.com']);
    expect(body.text).toContain('abc123');
    expect(body.html).toContain('Verify email address');
    expect(body.html).toContain('abc123');
  });

  it('throws when Resend API returns an error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"message":"domain not verified"}',
    } as Response);

    const service = createService({ resendApiKey: 're_test_key' });
    await expect(
      service.sendVerificationEmail('user@example.com', 'token'),
    ).rejects.toThrow(/Failed to send email via Resend/);
  });
});
