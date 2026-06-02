import { getAppEnvironment } from './mongodb.config';

export type LlmProviderId = 'stub' | 'openai' | 'anthropic' | 'google';

const ALLOWED_PROVIDERS: LlmProviderId[] = [
  'stub',
  'openai',
  'anthropic',
  'google',
];

export interface OpenAiLlmConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AnthropicLlmConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface GoogleLlmConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface LlmResolvedConfig {
  provider: LlmProviderId;
  timeoutMs: number;
  openai: OpenAiLlmConfig | null;
  anthropic: AnthropicLlmConfig | null;
  google: GoogleLlmConfig | null;
}

function parseProvider(): LlmProviderId {
  const raw = (process.env.LLM_PROVIDER?.trim().toLowerCase() || 'stub') as LlmProviderId;
  if (!ALLOWED_PROVIDERS.includes(raw)) {
    throw new Error(
      `LLM_PROVIDER must be one of: ${ALLOWED_PROVIDERS.join(', ')}`,
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

function requireApiKey(envName: string, value: string | undefined): string {
  const key = value?.trim();
  if (key) {
    return key;
  }

  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || 'stub';
  const message = `${envName} is required when LLM_PROVIDER=${provider}`;
  if (getAppEnvironment() === 'production') {
    throw new Error(message);
  }
  throw new Error(message);
}

export function resolveLlmConfig(): LlmResolvedConfig {
  const provider = parseProvider();
  const timeoutMs = parseTimeoutMs();

  const base = {
    provider,
    timeoutMs,
    openai: null as OpenAiLlmConfig | null,
    anthropic: null as AnthropicLlmConfig | null,
    google: null as GoogleLlmConfig | null,
  };

  switch (provider) {
    case 'stub':
      return base;
    case 'openai':
      return {
        ...base,
        openai: {
          apiKey: requireApiKey(
            'OPENAI_API_KEY',
            process.env.OPENAI_API_KEY,
          ),
          model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
          baseUrl:
            process.env.OPENAI_BASE_URL?.trim() ||
            'https://api.openai.com/v1',
        },
      };
    case 'anthropic':
      return {
        ...base,
        anthropic: {
          apiKey: requireApiKey(
            'ANTHROPIC_API_KEY',
            process.env.ANTHROPIC_API_KEY,
          ),
          model:
            process.env.ANTHROPIC_MODEL?.trim() ||
            'claude-3-5-haiku-20241022',
          baseUrl:
            process.env.ANTHROPIC_BASE_URL?.trim() ||
            'https://api.anthropic.com/v1',
        },
      };
    case 'google':
      return {
        ...base,
        google: {
          apiKey: requireApiKey(
            'GOOGLE_API_KEY or GEMINI_API_KEY',
            process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
          ),
          model: process.env.GOOGLE_MODEL?.trim() || 'gemini-2.0-flash',
          baseUrl:
            process.env.GOOGLE_BASE_URL?.trim() ||
            'https://generativelanguage.googleapis.com/v1beta',
        },
      };
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported LLM provider: ${String(_exhaustive)}`);
    }
  }
}
