export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionResult {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface LlmStreamHandlers {
  onDelta: (text: string) => void;
}

export interface LlmStreamOptions {
  signal?: AbortSignal;
}

export interface LlmProvider {
  complete(messages: LlmMessage[]): Promise<LlmCompletionResult>;
  completeStream(
    messages: LlmMessage[],
    handlers: LlmStreamHandlers,
    options?: LlmStreamOptions,
  ): Promise<LlmCompletionResult>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
