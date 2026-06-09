import { StubLlmProvider } from './stub-llm.provider';

describe('StubLlmProvider', () => {
  const provider = new StubLlmProvider();

  it('streams word chunks and returns usage', async () => {
    const deltas: string[] = [];

    const result = await provider.completeStream(
      [{ role: 'user', content: 'Hello' }],
      { onDelta: (text) => deltas.push(text) },
    );

    expect(deltas.join('')).toBe(result.content);
    expect(result.content).toContain('[stub]');
    expect(result.model).toBe('stub');
    expect(result.completionTokens).toBeGreaterThan(0);
  });

  it('returns partial content when aborted mid-stream', async () => {
    const controller = new AbortController();
    const deltas: string[] = [];

    setTimeout(() => controller.abort(), 12);

    const result = await provider.completeStream(
      [{ role: 'user', content: 'Hello there friend' }],
      { onDelta: (text) => deltas.push(text) },
      { signal: controller.signal },
    );

    expect(result.content).toBe(deltas.join(''));
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content.length).toBeLessThan('[stub] Received: Hello there friend'.length);
  });
});
