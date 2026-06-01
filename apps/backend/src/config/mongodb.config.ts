export type AppEnvironment = 'development' | 'production' | 'test';

const DEFAULT_URI = 'mongodb://localhost:27017';
const DEFAULT_DB_BY_ENV = {
  development: 'actocore_dev',
  production: 'actocore',
  test: 'actocore_test',
} as const;

export function getAppEnvironment(): AppEnvironment {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production' || env === 'test') {
    return env;
  }
  return 'development';
}

/** Database name from `MONGODB_DB_NAME`, or a default per NODE_ENV. */
export function resolveMongoDatabaseName(): string {
  const explicit = process.env.MONGODB_DB_NAME?.trim();
  if (explicit) {
    return explicit;
  }
  return DEFAULT_DB_BY_ENV[getAppEnvironment()];
}

/**
 * Builds the MongoDB connection string: `MONGODB_URI` + `MONGODB_DB_NAME`.
 * Any database path in `MONGODB_URI` is replaced by the resolved name.
 */
export function resolveMongoUri(): string {
  const nodeEnv = getAppEnvironment();
  const baseUri = process.env.MONGODB_URI?.trim();
  const dbName = resolveMongoDatabaseName();

  if (!baseUri) {
    if (nodeEnv === 'production') {
      throw new Error(
        'MONGODB_URI is required in production (e.g. mongodb+srv://user:pass@cluster.example).',
      );
    }
    return withDatabase(DEFAULT_URI, dbName);
  }

  return withDatabase(baseUri, dbName);
}

/** Database name segment from a full connection URI (for logging). */
export function getMongoDatabaseName(uri: string): string {
  try {
    const pathname = new URL(uri).pathname.replace(/^\//, '');
    if (pathname) {
      return pathname.split('/')[0] ?? resolveMongoDatabaseName();
    }
  } catch {
    // fall through for non-standard URIs
  }
  return resolveMongoDatabaseName();
}

export function withDatabase(uri: string, dbName: string): string {
  const url = new URL(uri);
  url.pathname = `/${dbName}`;
  return url.toString();
}
