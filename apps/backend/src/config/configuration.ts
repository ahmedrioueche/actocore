import { DEFAULT_API_VERSION } from '@ahmedrioueche/actocore-shared';
import {
  getAppEnvironment,
  getMongoDatabaseName,
  resolveMongoDatabaseName,
  resolveMongoUri,
} from './mongodb.config';
import { resolveAuthConfig } from './auth.config';
import { resolveHttpConfig } from './http.config';
import { isRedisEnabled, resolveRedisUrl } from './redis.config';

export default () => {
  const uri = resolveMongoUri();
  const nodeEnv = getAppEnvironment();
  const redisUrl = resolveRedisUrl();

  return {
    nodeEnv,
    apiVersion: process.env.API_VERSION?.trim() || DEFAULT_API_VERSION,
    port: parseInt(process.env.PORT ?? '3000', 10),
    mongodb: {
      uri,
      database: getMongoDatabaseName(uri),
      databaseName: resolveMongoDatabaseName(),
    },
    redis: {
      enabled: isRedisEnabled(),
      url: redisUrl,
    },
    http: resolveHttpConfig(),
    auth: resolveAuthConfig(),
  };
};
