import { Test } from '@nestjs/testing';
import { LLM_PROVIDER } from '../external/llm/llm-provider.interface';
import { RedisService } from '../redis/redis.service';
import {
  RagQueryRewriteService,
  buildRewriteCacheKey,
  normalizeSearchQuery,
} from './rag-query-rewrite.service';

describe('rag query rewrite helpers', () => {
  it('builds stable cache keys per session and message', () => {
    const a = buildRewriteCacheKey('Hello', 'session-1');
    const b = buildRewriteCacheKey('Hello', 'session-1');
    const c = buildRewriteCacheKey('Hello', 'session-2');

    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.startsWith('rag:rewrite:session-1:')).toBe(true);
  });

  it('normalizes LLM output to a single search query line', () => {
    expect(normalizeSearchQuery('"team invite process"', 'fallback')).toBe(
      'team invite process',
    );
    expect(normalizeSearchQuery('', 'fallback')).toBe('fallback');
    expect(normalizeSearchQuery('  billing FAQ\nextra line', 'fallback')).toBe(
      'billing FAQ',
    );
  });
});

describe('RagQueryRewriteService', () => {
  const llm = { complete: jest.fn() };
  const redis = {
    get: jest.fn(),
    setWithTtl: jest.fn(),
  };

  let service: RagQueryRewriteService;
  const originalEnv = process.env.RAG_QUERY_REWRITE;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.RAG_QUERY_REWRITE = 'true';
    redis.get.mockResolvedValue(null);
    redis.setWithTtl.mockResolvedValue(true);
    llm.complete.mockResolvedValue({
      content: 'invite editor to workspace team',
      model: 'stub',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        RagQueryRewriteService,
        { provide: LLM_PROVIDER, useValue: llm },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(RagQueryRewriteService);
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.RAG_QUERY_REWRITE;
    } else {
      process.env.RAG_QUERY_REWRITE = originalEnv;
    }
  });

  it('returns original message when rewrite is disabled', async () => {
    process.env.RAG_QUERY_REWRITE = 'false';

    const result = await service.rewrite('How do I add someone?', {
      sessionId: 's1',
    });

    expect(result).toEqual({
      searchQuery: 'How do I add someone?',
      rewritten: false,
    });
    expect(llm.complete).not.toHaveBeenCalled();
  });

  it('rewrites via LLM and caches the result', async () => {
    const result = await service.rewrite('How do I add someone to my team?', {
      sessionId: 's1',
    });

    expect(result.searchQuery).toBe('invite editor to workspace team');
    expect(result.rewritten).toBe(true);
    expect(llm.complete).toHaveBeenCalled();
    expect(redis.setWithTtl).toHaveBeenCalledWith(
      buildRewriteCacheKey('How do I add someone to my team?', 's1'),
      'invite editor to workspace team',
      3600,
    );
  });

  it('uses cached rewrite without calling the LLM', async () => {
    redis.get.mockResolvedValue('cached search query');

    const result = await service.rewrite('How do I add someone?', {
      sessionId: 's1',
    });

    expect(result.searchQuery).toBe('cached search query');
    expect(llm.complete).not.toHaveBeenCalled();
  });
});
