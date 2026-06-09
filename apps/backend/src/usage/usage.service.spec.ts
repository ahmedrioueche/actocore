import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Project } from '../projects/schemas/project.schema';
import { ProjectsService } from '../projects/projects.service';
import { StudioAccount } from '../studio/schemas/studio-account.schema';
import { StudioPlatformBootstrapService } from '../studio/studio-platform-bootstrap.service';
import { ChatMessage } from '../sessions/schemas/chat-message.schema';
import { ChatSession } from '../sessions/schemas/chat-session.schema';
import { KnowledgeChunk } from '../knowledge/schemas/knowledge-chunk.schema';
import { KnowledgeSource } from '../knowledge/schemas/knowledge-source.schema';
import { UsageEvent } from './schemas/usage-event.schema';
import { UsageService } from './usage.service';

describe('UsageService', () => {
  let service: UsageService;

  const usageModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };
  const projectModel = {
    find: jest.fn(),
  };
  const accountModel = {
    find: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue({ provider: 'openai' }),
  };
  const bootstrap = {
    getPlatformAccountId: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        { provide: ConfigService, useValue: configService },
        { provide: StudioPlatformBootstrapService, useValue: bootstrap },
        { provide: getModelToken(UsageEvent.name), useValue: usageModel },
        { provide: getModelToken(Project.name), useValue: projectModel },
        { provide: getModelToken(StudioAccount.name), useValue: accountModel },
        { provide: getModelToken(KnowledgeSource.name), useValue: {} },
        { provide: getModelToken(KnowledgeChunk.name), useValue: {} },
        { provide: getModelToken(ChatSession.name), useValue: {} },
        { provide: getModelToken(ChatMessage.name), useValue: {} },
        {
          provide: ProjectsService,
          useValue: { assertExists: jest.fn(), list: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsageService);
  });

  it('stores llmProvider when recording chat usage', async () => {
    usageModel.create.mockResolvedValue({});

    await service.recordChatUsage({
      projectId: 'proj-1',
      intent: 'direct',
      llmProvider: 'openai',
      usage: { model: 'gpt-4o-mini', promptTokens: 10, completionTokens: 5 },
    });

    expect(usageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-1',
        route: 'sdk/chat',
        llmProvider: 'openai',
        llmModel: 'gpt-4o-mini',
        promptTokens: 10,
        completionTokens: 5,
      }),
    );
  });

  it('sums prompt and completion tokens for the current UTC month', async () => {
    usageModel.aggregate.mockReturnValue({
      exec: async () => [{ total: 42 }],
    });

    const total = await service.sumChatTokensThisMonth('proj-1');

    expect(total).toBe(42);
    expect(usageModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            projectId: 'proj-1',
            route: 'sdk/chat',
          }),
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            total: expect.objectContaining({
              $sum: expect.objectContaining({ $add: expect.any(Array) }),
            }),
          }),
        }),
      ]),
    );
  });

  it('aggregates platform usage overview by provider', async () => {
    projectModel.find.mockReturnValue({
      select: () => ({
        exec: async () => [
          {
            _id: { toString: () => 'proj-1' },
            name: 'Demo',
            accountId: 'acc-1',
          },
        ],
      }),
    });
    usageModel.find.mockReturnValue({
      select: () => ({
        exec: async () => [
          {
            projectId: 'proj-1',
            llmProvider: 'openai',
            llmModel: 'gpt-4o-mini',
            intent: 'direct',
            promptTokens: 10,
            completionTokens: 4,
            success: true,
            latencyMs: 120,
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
          },
          {
            projectId: 'proj-1',
            llmProvider: undefined,
            llmModel: 'legacy-model',
            intent: 'qa',
            promptTokens: 6,
            completionTokens: 2,
            success: false,
            latencyMs: 200,
            createdAt: new Date('2026-06-02T12:00:00.000Z'),
          },
        ],
      }),
    });
    accountModel.find.mockReturnValue({
      select: () => ({
        exec: async () => [
          {
            _id: { toString: () => 'acc-1' },
            name: 'Acme',
          },
        ],
      }),
    });

    const overview = await service.getPlatformUsageOverview(
      '2026-06-01T00:00:00.000Z',
      '2026-06-07T00:00:00.000Z',
    );

    expect(overview.configuredProvider).toBe('openai');
    expect(overview.totalRequests).toBe(2);
    expect(overview.totalPromptTokens).toBe(16);
    expect(overview.totalCompletionTokens).toBe(6);
    expect(overview.totalErrors).toBe(1);
    expect(overview.byProvider.openai.requests).toBe(1);
    expect(overview.byProvider.unknown.requests).toBe(1);
    expect(overview.byModel['gpt-4o-mini']).toBe(1);
    expect(overview.topAccounts[0]?.accountName).toBe('Acme');
    expect(overview.topProjects[0]?.projectName).toBe('Demo');
    expect(overview.buckets).toHaveLength(2);
  });
});
