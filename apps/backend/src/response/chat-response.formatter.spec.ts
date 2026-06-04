import { ChatResponseFormatter } from './chat-response.formatter';

describe('ChatResponseFormatter', () => {
  const formatter = new ChatResponseFormatter();

  it('formats direct responses with usage', () => {
    const result = formatter.format({
      sessionId: 's1',
      messageId: 'm1',
      intent: 'direct',
      branch: {
        content: '  Hello  ',
        usage: { model: 'stub', promptTokens: 1, completionTokens: 2 },
      },
    });

    expect(result.content).toBe('Hello');
    expect(result.usage?.model).toBe('stub');
    expect(result.action).toBeUndefined();
    expect(result.sources).toBeUndefined();
  });

  it('includes action only for action intent', () => {
    const result = formatter.format({
      sessionId: 's1',
      messageId: 'm1',
      intent: 'action',
      branch: {
        content: 'Run it',
        action: {
          actionId: 'a1',
          actionName: 'deploy',
          status: 'pending',
          input: {},
        },
      },
    });

    expect(result.action?.actionName).toBe('deploy');
  });

  it('shows pending action even when intentOverride is direct', () => {
    const result = formatter.format({
      sessionId: 's1',
      messageId: 'm1',
      intent: 'action',
      branch: {
        content: 'Ready to run "delete_user" in your application.',
        intentOverride: 'direct',
        action: {
          actionId: 'a1',
          actionName: 'delete_user',
          status: 'pending',
          input: { email: 'bob@demo.com' },
        },
      },
    });

    expect(result.intent).toBe('action');
    expect(result.action?.status).toBe('pending');
  });

  it('includes sources only for qa intent', () => {
    const result = formatter.format({
      sessionId: 's1',
      messageId: 'm1',
      intent: 'qa',
      branch: {
        content: 'Answer',
        sources: [
          {
            sourceId: 'k1',
            sourceTitle: 'FAQ',
            chunkIndex: 0,
            excerpt: 'docs',
            score: 0.8,
          },
        ],
      },
    });

    expect(result.sources).toHaveLength(1);
  });
});
