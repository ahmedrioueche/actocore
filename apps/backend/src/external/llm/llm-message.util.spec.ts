import {
  splitSystemMessages,
  toAnthropicPayload,
  toGeminiPayload,
} from './llm-message.util';
import type { LlmMessage } from './llm-provider.interface';

describe('llm-message.util', () => {
  const messages: LlmMessage[] = [
    { role: 'system', content: 'You are helpful.' },
    { role: 'system', content: 'Be concise.' },
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there' },
    { role: 'user', content: 'Thanks' },
  ];

  it('merges system messages', () => {
    const { system, conversation } = splitSystemMessages(messages);
    expect(system).toBe('You are helpful.\n\nBe concise.');
    expect(conversation).toHaveLength(3);
  });

  it('maps anthropic payload without system role in messages', () => {
    const payload = toAnthropicPayload(messages);
    expect(payload.system).toContain('You are helpful.');
    expect(payload.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'Thanks' },
    ]);
  });

  it('maps gemini assistant role to model', () => {
    const payload = toGeminiPayload(messages);
    expect(payload.systemInstruction?.parts[0].text).toContain('helpful');
    expect(payload.contents[1]).toEqual({
      role: 'model',
      parts: [{ text: 'Hi there' }],
    });
  });
});
