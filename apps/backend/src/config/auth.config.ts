import { getAppEnvironment } from './mongodb.config';

const DEV_PEPPER = 'actocore-dev-api-key-pepper-change-me';

export function resolveAuthConfig() {
  const explicit = process.env.API_KEY_PEPPER?.trim();
  const nodeEnv = getAppEnvironment();

  if (explicit) {
    return { apiKeyPepper: explicit };
  }

  if (nodeEnv === 'production') {
    throw new Error('API_KEY_PEPPER is required in production');
  }

  return { apiKeyPepper: DEV_PEPPER };
}
