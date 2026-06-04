import type { SessionMessageData } from '@ahmedrioueche/actocore-shared';
import { resolveActionFollowUp } from './action-follow-up.util';

function msg(
  role: SessionMessageData['role'],
  content: string,
): SessionMessageData {
  return {
    id: '1',
    sessionId: 's1',
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

describe('resolveActionFollowUp', () => {
  const actions = ['add_user', 'delete_user', 'update_user', 'list_users'];

  it('resumes delete_user when user replies with email after clarify', () => {
    const history = [
      msg('user', 'delete'),
      msg(
        'assistant',
        'Which user should I delete? Please share their email address.',
      ),
    ];

    const result = resolveActionFollowUp('bob@demo.com', history, actions);
    expect(result).toEqual({
      actionName: 'delete_user',
      input: { email: 'bob@demo.com' },
    });
  });

  it('resumes delete_user when user confirms after clarify + email in history', () => {
    const history = [
      msg('user', 'delete'),
      msg(
        'assistant',
        'Which user should I delete? Please share their email address.',
      ),
      msg('user', 'bob@demo.com'),
      msg(
        'assistant',
        'Ready to run "delete_user" in your application with the validated parameters below.',
      ),
    ];

    const result = resolveActionFollowUp('ok go', history, actions);
    expect(result).toEqual({
      actionName: 'delete_user',
      input: { email: 'bob@demo.com' },
    });
  });

  it('returns null when there is no prior clarify or ready message', () => {
    const history = [msg('user', 'hello'), msg('assistant', 'Hi there!')];
    expect(resolveActionFollowUp('bob@demo.com', history, actions)).toBeNull();
  });
});
