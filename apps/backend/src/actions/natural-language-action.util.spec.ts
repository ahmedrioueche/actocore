import {
  extractNaturalLanguageActionInput,
  isLikelyActionMessage,
  matchesNaturalLanguageAction,
} from './natural-language-action.util';

describe('natural-language-action.util', () => {
  const userActions = ['add_user', 'delete_user', 'update_user', 'list_users'];

  it('detects natural-language update user requests', () => {
    const message =
      'update user with email alice@demo.com, make their name Alice Kiro';
    expect(isLikelyActionMessage(message, userActions)).toBe(true);
    expect(matchesNaturalLanguageAction(message, 'update_user')).toBe(true);
  });

  it('extracts email and name from natural language', () => {
    const input = extractNaturalLanguageActionInput(
      'update user with email alice@demo.com, make their name Alice Kiro',
      'update_user',
    );
    expect(input).toEqual({
      email: 'alice@demo.com',
      name: 'Alice Kiro',
    });
  });

  it('detects common typos for delete user', () => {
    expect(
      isLikelyActionMessage('delte user', userActions),
    ).toBe(true);
    expect(matchesNaturalLanguageAction('delte user', 'delete_user')).toBe(
      true,
    );
  });

  it('detects add user phrasing', () => {
    expect(
      matchesNaturalLanguageAction(
        'Please add user jane@demo.com named Jane Doe',
        'add_user',
      ),
    ).toBe(true);
  });

  it('detects delete + email without the word user', () => {
    const message = 'delte bob@demo.com';
    expect(isLikelyActionMessage(message, userActions)).toBe(true);
    expect(matchesNaturalLanguageAction(message, 'delete_user')).toBe(true);
    expect(extractNaturalLanguageActionInput(message, 'delete_user')).toEqual({
      email: 'bob@demo.com',
    });
  });

  it('does not treat create-project intent as a project name', () => {
    expect(
      extractNaturalLanguageActionInput(
        'Help me with create project',
        'create_project',
      ),
    ).toEqual({});
    expect(
      matchesNaturalLanguageAction(
        'Help me with create project',
        'create_project',
      ),
    ).toBe(true);
  });

  it('extracts explicit project names', () => {
    expect(
      extractNaturalLanguageActionInput(
        'create project called GymPro',
        'create_project',
      ),
    ).toEqual({ name: 'GymPro' });
  });

  it('extracts title from delete_project starter phrases', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        title: { type: 'string', title: 'Title' },
      },
      required: ['title'],
    };

    expect(
      extractNaturalLanguageActionInput(
        'delete project GymPro',
        'delete_project',
        schema,
      ),
    ).toEqual({ title: 'GymPro' });

    expect(
      extractNaturalLanguageActionInput(
        'Help me with delete project. I need the title: konga',
        'delete_project',
        schema,
      ),
    ).toEqual({ title: 'konga' });

    expect(
      extractNaturalLanguageActionInput(
        'Help me with delete project. I need the title My project',
        'delete_project',
        schema,
      ),
    ).toEqual({ title: 'My project' });

    expect(
      extractNaturalLanguageActionInput(
        'Help me with delete project. I need the title: GymPro',
        'delete_project',
        schema,
      ),
    ).toEqual({ title: 'GymPro' });
  });

  it('extracts create project name from its name is phrasing', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string', title: 'Project name' },
      },
      required: ['name'],
    };

    expect(
      extractNaturalLanguageActionInput(
        'Help me with create project, its name is GymPro',
        'create_project',
        schema,
      ),
    ).toEqual({ name: 'GymPro' });
  });
});
