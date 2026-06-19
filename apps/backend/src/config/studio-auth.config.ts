import { getAppEnvironment } from './mongodb.config';

const DEV_JWT_SECRET = 'actocore-dev-studio-jwt-change-me';
const DEV_JWT_REFRESH_SECRET = 'actocore-dev-studio-refresh-change-me';
const DEV_PASSWORD_PEPPER = 'actocore-dev-studio-password-pepper';

export type StudioAuthConfig = {
  disabled: boolean;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  passwordPepper: string;
  studioAppUrl: string;
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleRedirectUri: string | null;
  emailFrom: string;
  /** Inbox for marketing site contact form submissions. */
  contactInboxEmail: string;
  /** Inbox for Studio report submissions. */
  reportsInboxEmail: string;
  /** Inbox for platform activity alerts (signups, projects, subscriptions). */
  platformNotifyEmail: string;
  /** Set PLATFORM_NOTIFY_ENABLED=false to disable platform activity emails. */
  platformNotifyEnabled: boolean;
  /** HTTPS API — works on Render free tier (no SMTP ports). */
  resendApiKey: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPass: string | null;
  defaultProjectOnSignup: boolean;
  defaultProjectName: string;
};

function resolveEmailFrom(): string {
  const studioFrom = process.env.STUDIO_EMAIL_FROM?.trim();
  if (studioFrom) {
    return studioFrom;
  }
  const resendFrom = process.env.RESEND_EMAIL_FROM?.trim();
  if (resendFrom) {
    return resendFrom.includes('<') ? resendFrom : `ActoCore Studio <${resendFrom}>`;
  }
  return 'noreply@actocore.local';
}

export function resolveStudioAuthConfig(): StudioAuthConfig {
  const nodeEnv = getAppEnvironment();
  const forceEnabled = process.env.STUDIO_AUTH_DISABLED === 'false';
  const disabled =
    process.env.STUDIO_AUTH_DISABLED === 'true' ||
    (nodeEnv === 'test' && !forceEnabled);

  const jwtSecret =
    process.env.STUDIO_JWT_SECRET?.trim() ||
    (nodeEnv === 'production' ? '' : DEV_JWT_SECRET);
  const jwtRefreshSecret =
    process.env.STUDIO_JWT_REFRESH_SECRET?.trim() ||
    (nodeEnv === 'production' ? '' : DEV_JWT_REFRESH_SECRET);

  if (!disabled && (!jwtSecret || !jwtRefreshSecret)) {
    throw new Error(
      'STUDIO_JWT_SECRET and STUDIO_JWT_REFRESH_SECRET are required when Studio auth is enabled.',
    );
  }

  const passwordPepper =
    process.env.STUDIO_PASSWORD_PEPPER?.trim() ||
    (nodeEnv === 'production' ? '' : DEV_PASSWORD_PEPPER);

  if (!disabled && !passwordPepper) {
    throw new Error('STUDIO_PASSWORD_PEPPER is required when Studio auth is enabled.');
  }

  return {
    disabled,
    jwtSecret: jwtSecret || DEV_JWT_SECRET,
    jwtRefreshSecret: jwtRefreshSecret || DEV_JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: process.env.STUDIO_JWT_ACCESS_EXPIRES_IN?.trim() || '15m',
    jwtRefreshExpiresIn:
      process.env.STUDIO_JWT_REFRESH_EXPIRES_IN?.trim() || '7d',
    passwordPepper: passwordPepper || DEV_PASSWORD_PEPPER,
    studioAppUrl:
      process.env.STUDIO_APP_URL?.trim() || 'http://localhost:5173',
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || null,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI?.trim() || null,
    emailFrom: resolveEmailFrom(),
    contactInboxEmail:
      process.env.CONTACT_INBOX_EMAIL?.trim() || 'adsrahmed@gmail.com',
    reportsInboxEmail:
      process.env.REPORTS_INBOX_EMAIL?.trim() || 'adsrahmed@gmail.com',
    platformNotifyEmail:
      process.env.PLATFORM_NOTIFY_EMAIL?.trim() ||
      process.env.CONTACT_INBOX_EMAIL?.trim() ||
      'adsrahmed@gmail.com',
    platformNotifyEnabled: process.env.PLATFORM_NOTIFY_ENABLED !== 'false',
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
    smtpHost: process.env.SMTP_HOST?.trim() || null,
    smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
    smtpUser: process.env.SMTP_USER?.trim() || null,
    smtpPass: process.env.SMTP_PASS?.trim() || null,
    defaultProjectOnSignup:
      process.env.STUDIO_DEFAULT_PROJECT_ON_SIGNUP !== 'false',
    defaultProjectName:
      process.env.STUDIO_DEFAULT_PROJECT_NAME?.trim() || 'My project',
  };
}
