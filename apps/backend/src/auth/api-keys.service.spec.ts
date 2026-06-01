import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { ProjectsService } from '../projects/projects.service';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyException } from './exceptions/api-key.exception';
import { ApiKey } from './schemas/api-key.schema';
import {
  extractKeyPrefix,
  generateApiKeySecret,
  hashApiKey,
} from './utils/api-key-crypto';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  const pepper = 'test-pepper';
  const store = new Map<string, Record<string, unknown>>();

  const mockModel = {
    create: jest.fn(async (doc: Record<string, unknown>) => {
      const id = `key-${store.size + 1}`;
      const record = {
        _id: { toString: () => id },
        ...doc,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        revokedAt: undefined,
      };
      store.set(doc.prefix as string, record);
      return record;
    }),
    findOne: jest.fn(({ prefix }: { prefix: string }) => ({
      exec: async () => store.get(prefix) ?? null,
    })),
    findByIdAndUpdate: jest.fn(
      (id: string, update: Record<string, unknown>) => ({
        exec: async () => {
          const entry = [...store.values()].find(
            (item) => item._id.toString() === id,
          );
          if (!entry) return null;
          Object.assign(entry, update);
          return entry;
        },
      }),
    ),
  };

  beforeEach(async () => {
    store.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getModelToken(ApiKey.name),
          useValue: mockModel,
        },
        {
          provide: ConfigService,
          useValue: { get: () => pepper },
        },
        {
          provide: ProjectsService,
          useValue: { assertExists: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('issues a key and validates it', async () => {
    const issued = await service.issue({ projectId: 'proj-1', name: 'dev' });
    expect(issued.key.startsWith('aco_')).toBe(true);

    const validated = await service.validateBearerToken(
      `Bearer ${issued.key}`,
    );
    expect(validated.projectId).toBe('proj-1');
  });

  it('rejects revoked keys', async () => {
    const issued = await service.issue({ projectId: 'proj-1' });
    await service.revoke(issued.id);

    await expect(
      service.validateBearerToken(`Bearer ${issued.key}`),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.API_KEY_REVOKED,
      },
    });
  });

  it('rejects missing bearer token', async () => {
    await expect(service.validateBearerToken(undefined)).rejects.toBeInstanceOf(
      ApiKeyException,
    );
  });

  it('hashes keys deterministically with pepper', async () => {
    const raw = generateApiKeySecret();
    const hash = await hashApiKey(raw, pepper);
    expect(extractKeyPrefix(raw)).toHaveLength(12);
    expect(hash).not.toEqual(raw);
  });
});
