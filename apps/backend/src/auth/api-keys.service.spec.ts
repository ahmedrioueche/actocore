import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../projects/projects.service';
import { StudioAccessService } from '../studio/studio-access.service';
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
    find: jest.fn(
      (
        filter: {
          projectId?: string;
          revokedAt?: { $exists: boolean };
        } = {},
      ) => ({
        sort: () => ({
          exec: async () =>
            [...store.values()].filter((item) => {
              if (filter.projectId && item.projectId !== filter.projectId) {
                return false;
              }
              if (filter.revokedAt?.$exists === false && item.revokedAt) {
                return false;
              }
              return true;
            }),
        }),
      }),
    ),
    findById: jest.fn((id: string) => ({
      exec: async () =>
        [...store.values()].find((item) => item._id.toString() === id) ?? null,
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
    updateMany: jest.fn(
      (
        filter: { projectId?: string; revokedAt?: { $exists: boolean } },
        update: { revokedAt?: Date },
      ) => {
        let modifiedCount = 0;
        for (const entry of store.values()) {
          if (filter.projectId && entry.projectId !== filter.projectId) {
            continue;
          }
          if (filter.revokedAt?.$exists === false && entry.revokedAt) {
            continue;
          }
          if (update.revokedAt) {
            entry.revokedAt = update.revokedAt;
            modifiedCount += 1;
          }
        }
        return Promise.resolve({ modifiedCount });
      },
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
          useValue: {
            assertExists: jest.fn().mockResolvedValue(undefined),
            assertExistsForAccount: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: StudioAccessService,
          useValue: { assertProjectAccess: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('issues a key and validates it', async () => {
    const issued = await service.issue({ projectId: 'proj-1', name: 'dev' });
    expect(issued.key.startsWith('aco_')).toBe(true);

    const validated = await service.validateBearerToken(`Bearer ${issued.key}`);
    expect(validated.projectId).toBe('proj-1');
  });

  it('rejects revoked keys', async () => {
    const issued = await service.issue({ projectId: 'proj-1' });
    await service.revoke(null, issued.id);

    await expect(
      service.validateBearerToken(`Bearer ${issued.key}`),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.API_KEY_REVOKED,
      },
    });
  });

  it('rotates all active keys for a project', async () => {
    await service.issue({ projectId: 'proj-1', name: 'a' });
    await service.issue({ projectId: 'proj-1', name: 'b' });
    const result = await service.rotateAllForProject(null, 'proj-1');
    expect(result.revokedCount).toBe(2);
    const list = await service.listForProject(null, 'proj-1');
    expect(list).toHaveLength(0);
  });

  it('lists keys for a project', async () => {
    await service.issue({ projectId: 'proj-1', name: 'a' });
    const list = await service.listForProject(null, 'proj-1');
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('a');
    expect((list[0] as { key?: string }).key).toBeUndefined();
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
