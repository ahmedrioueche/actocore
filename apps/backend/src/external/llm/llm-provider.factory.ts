import type { LlmResolvedConfig } from '../../config/llm.config';
import { AnthropicLlmProvider } from './providers/anthropic-llm.provider';
import { GoogleLlmProvider } from './providers/google-llm.provider';
import { OpenAiLlmProvider } from './providers/openai-llm.provider';
import type { LlmProvider } from './llm-provider.interface';
import { StubLlmProvider } from './stub-llm.provider';

export function createLlmProvider(config: LlmResolvedConfig): LlmProvider {
  switch (config.provider) {
    case 'stub':
      return new StubLlmProvider();
    case 'openai':
      if (!config.openai) {
        throw new Error('OpenAI config is missing');
      }
      return new OpenAiLlmProvider(config.openai, config.timeoutMs);
    case 'anthropic':
      if (!config.anthropic) {
        throw new Error('Anthropic config is missing');
      }
      return new AnthropicLlmProvider(config.anthropic, config.timeoutMs);
    case 'google':
      if (!config.google) {
        throw new Error('Google/Gemini config is missing');
      }
      return new GoogleLlmProvider(config.google, config.timeoutMs);
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unsupported LLM provider: ${String(_exhaustive)}`);
    }
  }
}
