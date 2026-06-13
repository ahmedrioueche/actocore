import { getActionPromptStarter } from './action-prompt-starters';

describe('getActionPromptStarter', () => {
  it('prefers schema fields over description for composer starter', () => {
    expect(
      getActionPromptStarter({
        name: 'delete_user',
        description: 'Remove a user from the demo app by email.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'User name' },
          },
        },
      }),
    ).toBe('Help me with delete user. I need the user name: ');
  });

  it('uses Studio description when schema has no fields', () => {
    expect(
      getActionPromptStarter({
        name: 'delete_user',
        description: 'Remove a user from my team',
        inputSchema: { type: 'object', properties: {} },
      }),
    ).toBe('Remove a user from my team ');
  });

  it('builds starter from input schema fields', () => {
    expect(
      getActionPromptStarter({
        name: 'delete_user',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', title: 'Email address' },
          },
        },
      }),
    ).toBe('Help me with delete user. I need the email address: ');
  });

  it('lists multiple schema fields in the starter', () => {
    expect(
      getActionPromptStarter({
        name: 'update_user',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', title: 'Email address' },
            name: { type: 'string', title: 'Display name' },
          },
        },
      }),
    ).toBe('Help me with update user. I need email address and display name: ');
  });

  it('falls back to action slug when schema has no fields', () => {
    expect(
      getActionPromptStarter({
        name: 'create_project',
        inputSchema: { type: 'object', properties: {} },
      }),
    ).toBe('Help me with create project');
  });
});
