import { buildActionUserMessage, isActionFormComplete } from './action-form';

describe('action-form', () => {
  it('builds delete user natural language', () => {
    expect(
      buildActionUserMessage({ name: 'delete_user' }, { email: 'bob@demo.com' }),
    ).toBe('Delete user with email bob@demo.com');
  });

  it('requires all required fields before submit', () => {
    const fields = [
      { key: 'email', label: 'Email', required: true, inputType: 'email' as const },
    ];
    expect(isActionFormComplete(fields, {})).toBe(false);
    expect(isActionFormComplete(fields, { email: 'a@b.co' })).toBe(true);
  });
});
