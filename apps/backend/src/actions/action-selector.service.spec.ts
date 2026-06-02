import { ActionSelectorService } from './action-selector.service';

describe('ActionSelectorService', () => {
  const selector = new ActionSelectorService({
    complete: jest.fn(),
  });

  const actions = [
    {
      id: '1',
      projectId: 'p1',
      name: 'deploy',
      inputSchema: { type: 'object' },
      enabled: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('matches action name in user message', async () => {
    const result = await selector.select('Please run deploy now', actions);
    expect(result?.action.name).toBe('deploy');
  });
});
