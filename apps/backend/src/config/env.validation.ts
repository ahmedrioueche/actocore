import { resolveMongoUri } from './mongodb.config';

const ALLOWED_NODE_ENV = new Set(['development', 'production', 'test']);

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV ?? process.env.NODE_ENV ?? 'development');
  if (!ALLOWED_NODE_ENV.has(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be one of: ${[...ALLOWED_NODE_ENV].join(', ')}`,
    );
  }

  const portRaw = config.PORT ?? process.env.PORT ?? '3000';
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  resolveMongoUri();

  return config;
}
