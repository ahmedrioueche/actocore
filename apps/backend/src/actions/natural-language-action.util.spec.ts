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
});
