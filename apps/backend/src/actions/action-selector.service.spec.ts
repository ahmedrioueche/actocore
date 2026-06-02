import { ActionSelectorService } from './action-selector.service';

describe('ActionSelectorService', () => {
  const selector = new ActionSelectorService({
    complete: jest.fn(),
  });

  const deployAction = {
    id: '1',
    projectId: 'p1',
    name: 'deploy',
    inputSchema: { type: 'object' },
    enabled: true,
    createdAt: '',
    updatedAt: '',
  };

  const updateUserAction = {
    id: '2',
    projectId: 'p1',
    name: 'update_user',
    description: 'Update user',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['email', 'name'],
      additionalProperties: false,
    },
    enabled: true,
    createdAt: '',
    updatedAt: '',
  };

  it('matches action name in user message', async () => {
    const result = await selector.select('Please run deploy now', [deployAction]);
    expect(result?.action.name).toBe('deploy');
  });

  it('matches natural-language update user and extracts input', async () => {
    const result = await selector.select(
      'update user with email alice@demo.com, make their name Alice Kiro',
      [updateUserAction],
    );
    expect(result?.action.name).toBe('update_user');
    expect(result?.input).toEqual({
      email: 'alice@demo.com',
      name: 'Alice Kiro',
    });
  });
});
