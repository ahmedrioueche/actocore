import {
  buildAppAssistantSystemPrompt,
  formatHostContextBlock,
} from './app-assistant-prompt.util';

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
    expect(prompt).toContain('**Feature area**');
    expect(prompt).toContain('what pages, screens, or routes the app has');
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

  it('includes app sitemap and live host context when provided', () => {
    const prompt = buildAppAssistantSystemPrompt(
      {
        projectId: 'p1',
        projectName: 'Demo',
        settings: {},
        apiKeyId: 'k1',
      },
      ['add_member'],
      {
        appPages: [
          {
            id: 'members',
            title: 'Members',
            route: '/members',
            description: 'Manage members',
          },
        ],
        hostContext: {
          currentPage: 'members',
          route: '/members/42',
          selectedEntity: { type: 'member', id: '42', label: 'Jane' },
        },
      },
    );

    expect(prompt).toContain('Application pages (container nodes group screens');
    expect(prompt).toContain('members (/members)');
    expect(prompt).toContain('Current user context:');
    expect(prompt).toContain('Current page: Members (id: members)');
    expect(prompt).toContain('Selected member "Jane"');
  });

  it('formats host context without custom playground fields', () => {
    const block = formatHostContextBlock({
      currentPage: 'users',
      route: '/users',
    });

    expect(block).toContain('Current page: Users');
    expect(block).not.toContain('Session-uploaded reference');
  });
});
