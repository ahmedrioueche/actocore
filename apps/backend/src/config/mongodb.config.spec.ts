import {
  resolveMongoDatabaseName,
  resolveMongoUri,
  withDatabase,
} from './mongodb.config';

describe('mongodb.config', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB_NAME;
  });

  afterAll(() => {
    process.env = env;
  });

  describe('withDatabase', () => {
    it('sets the database path on a host-only URI', () => {
      expect(withDatabase('mongodb://localhost:27017', 'actocore_dev')).toBe(
        'mongodb://localhost:27017/actocore_dev',
      );
    });

    it('replaces an existing database path', () => {
      expect(
        withDatabase('mongodb://localhost:27017/old_db', 'actocore_dev'),
      ).toBe('mongodb://localhost:27017/actocore_dev');
    });
  });

  describe('resolveMongoUri', () => {
    it('uses MONGODB_URI with MONGODB_DB_NAME', () => {
      process.env.NODE_ENV = 'development';
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.MONGODB_DB_NAME = 'actocore_dev';

      expect(resolveMongoUri()).toBe(
        'mongodb://localhost:27017/actocore_dev',
      );
    });

    it('defaults to actocore_dev in development when MONGODB_DB_NAME is unset', () => {
      process.env.NODE_ENV = 'development';

      expect(resolveMongoUri()).toBe(
        'mongodb://localhost:27017/actocore_dev',
      );
    });

    it('defaults to actocore in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI =
        'mongodb+srv://user:pass@cluster.example/?retryWrites=true';

      expect(resolveMongoUri()).toBe(
        'mongodb+srv://user:pass@cluster.example/actocore?retryWrites=true',
      );
    });

    it('requires MONGODB_URI in production', () => {
      process.env.NODE_ENV = 'production';

      expect(() => resolveMongoUri()).toThrow(/MONGODB_URI/);
    });

    it('honours MONGODB_DB_NAME override', () => {
      process.env.NODE_ENV = 'development';
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.MONGODB_DB_NAME = 'my_custom_dev';

      expect(resolveMongoUri()).toBe(
        'mongodb://localhost:27017/my_custom_dev',
      );
    });

    it('defaults to actocore_test in test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:12345';

      expect(resolveMongoUri()).toBe(
        'mongodb://127.0.0.1:12345/actocore_test',
      );
    });
  });

  describe('resolveMongoDatabaseName', () => {
    it('returns MONGODB_DB_NAME when set', () => {
      process.env.MONGODB_DB_NAME = 'custom_db';

      expect(resolveMongoDatabaseName()).toBe('custom_db');
    });
  });
});
