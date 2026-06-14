import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLM_PROVIDER, type LlmProvider } from '../external/llm/llm-provider.interface';
import { RedisService } from '../redis/redis.service';

const REWRITE_CACHE_TTL_SECONDS = 3600;
const MAX_SEARCH_QUERY_CHARS = 512;

export interface RagQueryRewriteOptions {
  sessionId?: string;
}

@Injectable()
export class RagQueryRewriteService {
  private readonly logger = new Logger(RagQueryRewriteService.name);
  private readonly memoryCache = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly redis: RedisService,
  ) {}

  isEnabled(): boolean {
    return process.env.RAG_QUERY_REWRITE?.trim().toLowerCase() === 'true';
  }

  async rewrite(
    userMessage: string,
    options?: RagQueryRewriteOptions,
  ): Promise<{ searchQuery: string; rewritten: boolean }> {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      return { searchQuery: trimmed, rewritten: false };
    }

    if (!this.isEnabled()) {
      return { searchQuery: trimmed, rewritten: false };
    }

    const cacheKey = buildRewriteCacheKey(trimmed, options?.sessionId);
    const cached = await this.readCache(cacheKey);
    if (cached) {
      return {
        searchQuery: cached,
        rewritten: cached !== trimmed,
      };
    }

    try {
      const completion = await this.llm.complete([
        {
          role: 'system',
          content:
            'Rewrite the user message into one concise search query sentence for retrieving product documentation. Reply with the search query only.',
        },
        { role: 'user', content: trimmed },
      ]);

      const searchQuery = normalizeSearchQuery(completion.content, trimmed);
      await this.writeCache(cacheKey, searchQuery);

      return {
        searchQuery,
        rewritten: searchQuery !== trimmed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Query rewrite failed, using original message: ${message}`);
      return { searchQuery: trimmed, rewritten: false };
    }
  }

  private async readCache(key: string): Promise<string | null> {
    const fromRedis = await this.redis.get(key);
    if (fromRedis) {
      return fromRedis;
    }

    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  private async writeCache(key: string, value: string): Promise<void> {
    const stored = await this.redis.setWithTtl(
      key,
      value,
      REWRITE_CACHE_TTL_SECONDS,
    );
    if (stored) {
      return;
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + REWRITE_CACHE_TTL_SECONDS * 1000,
    });
  }
}

export function buildRewriteCacheKey(
  userMessage: string,
  sessionId?: string,
): string {
  const hash = createHash('sha256')
    .update(userMessage.trim().toLowerCase())
    .digest('hex')
    .slice(0, 16);

  return `rag:rewrite:${sessionId?.trim() || 'anon'}:${hash}`;
}

export function normalizeSearchQuery(
  raw: string,
  fallback: string,
): string {
  const firstLine = raw
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return fallback;
  }

  const unquoted = firstLine.replace(/^["'`]+|["'`]+$/g, '').trim();
  if (!unquoted) {
    return fallback;
  }

  return unquoted.length > MAX_SEARCH_QUERY_CHARS
    ? unquoted.slice(0, MAX_SEARCH_QUERY_CHARS).trim()
    : unquoted;
}

export function isQueryRewriteEnabled(): boolean {
  return process.env.RAG_QUERY_REWRITE?.trim().toLowerCase() === 'true';
}
