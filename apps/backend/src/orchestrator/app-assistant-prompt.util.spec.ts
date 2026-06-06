import { buildAppAssistantSystemPrompt } from './app-assistant-prompt.util';

describe('buildAppAssistantSystemPrompt', () => {
  it('scopes assistant to the app and declines off-topic help', () => {
    const prompt = buildAppAssistantSystemPrompt(
      {
        projectId: 'p1',
        projectName: 'Demo App',
        settings: {},
        apiKeyId: 'k1',
      },
      ['delete_user', 'add_user'],
    );

    expect(prompt).toContain('Demo App');
    expect(prompt).toContain('Do NOT answer off-topic');
    expect(prompt).toContain('delete_user');
    expect(prompt).toContain('Never pretend');
    expect(prompt).toContain('**Gym Management**');
  });

  it('appends custom project instructions', () => {
    const prompt = buildAppAssistantSystemPrompt(
      {
        projectId: 'p1',
        projectName: 'Demo',
        settings: { systemPrompt: 'Always mention the demo table.' },
        apiKeyId: 'k1',
      },
      [],
    );

    expect(prompt).toContain('Always mention the demo table');
    expect(prompt).toContain('no in-app actions configured');
  });
});
