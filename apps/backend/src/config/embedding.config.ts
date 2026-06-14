import type { OpenAiLlmConfig, GoogleLlmConfig } from './llm.config';
import { getAppEnvironment } from './mongodb.config';

export type EmbeddingProviderId = 'stub' | 'openai' | 'google';

const ALLOWED_PROVIDERS: EmbeddingProviderId[] = ['stub', 'openai', 'google'];

export interface EmbeddingResolvedConfig {
  provider: EmbeddingProviderId;
  timeoutMs: number;
  /** Populated when provider is openai; independent of LLM_PROVIDER. */
  openai: OpenAiLlmConfig | null;
  /** Populated when provider is google; uses GOOGLE_API_KEY or GEMINI_API_KEY. */
  google: GoogleLlmConfig | null;
}

function parseProvider(): EmbeddingProviderId {
  const raw = (process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() ||
    'stub') as EmbeddingProviderId;

  if (!ALLOWED_PROVIDERS.includes(raw)) {
    throw new Error(
      `EMBEDDING_PROVIDER must be one of: ${ALLOWED_PROVIDERS.join(', ')}`,
    );
  }

  return raw;
}

function parseTimeoutMs(): number {
  const raw = process.env.LLM_REQUEST_TIMEOUT_MS?.trim() ?? '120000';
  const ms = Number(raw);
  if (!Number.isInteger(ms) || ms < 1000 || ms > 600_000) {
    throw new Error(
      'LLM_REQUEST_TIMEOUT_MS must be an integer between 1000 and 600000',
    );
  }
  return ms;
}

function resolveOpenAiEmbeddingConfig(): OpenAiLlmConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai');
  }

  return {
    apiKey,
    model:
      process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
    baseUrl:
      process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
  };
}

function resolveGoogleEmbeddingConfig(): GoogleLlmConfig {
  const apiKey =
    process.env.GOOGLE_API_KEY?.trim() ?? process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GOOGLE_API_KEY or GEMINI_API_KEY is required when EMBEDDING_PROVIDER=google',
    );
  }

  return {
    apiKey,
    model:
      process.env.GOOGLE_EMBEDDING_MODEL?.trim() ??
      process.env.GEMINI_EMBEDDING_MODEL?.trim() ??
      'text-embedding-004',
    baseUrl:
      process.env.GOOGLE_BASE_URL?.trim() ||
      'https://generativelanguage.googleapis.com/v1beta',
  };
}

export function resolveEmbeddingConfig(): EmbeddingResolvedConfig {
  const provider = parseProvider();
  const timeoutMs = parseTimeoutMs();
  const stubBase = {
    provider: 'stub' as const,
    timeoutMs,
    openai: null,
    google: null,
  };

  switch (provider) {
    case 'openai':
      return {
        provider,
        timeoutMs,
        openai: resolveOpenAiEmbeddingConfig(),
        google: null,
      };
    case 'google':
      return {
        provider,
        timeoutMs,
        openai: null,
        google: resolveGoogleEmbeddingConfig(),
      };
    default:
      return stubBase;
  }
}
