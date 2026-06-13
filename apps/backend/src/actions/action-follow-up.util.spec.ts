import type { ActionData, SessionMessageData } from '@ahmedrioueche/actocore-shared';
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

function action(
  name: string,
  required: string[] = ['email'],
): ActionData {
  return {
    id: name,
    projectId: 'p1',
    name,
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(
        required.map((field) => [field, { type: 'string' }]),
      ),
      required,
    },
    enabled: true,
    createdAt: '',
    updatedAt: '',
  };
}

describe('resolveActionFollowUp', () => {
  const userActions = [
    action('add_user', ['email']),
    action('delete_user', ['email']),
    action('update_user', ['email']),
    action('list_users', []),
  ];

  it('resumes delete_user when user replies with email after clarify', () => {
    const history = [
      msg('user', 'delete'),
      msg(
        'assistant',
        'Which user should I delete? Please share their email address.',
      ),
    ];

    const result = resolveActionFollowUp('bob@demo.com', history, userActions);
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

    const result = resolveActionFollowUp('ok go', history, userActions);
    expect(result).toEqual({
      actionName: 'delete_user',
      input: { email: 'bob@demo.com' },
    });
  });

  it('resumes create_project with empty schema when user replies with name', () => {
    const actions: ActionData[] = [
      {
        ...action('create_project', []),
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    ];
    const history = [
      msg('user', 'Help me with create project'),
      msg('assistant', 'What would you like to name the new project?'),
    ];

    const result = resolveActionFollowUp('GymPro', history, actions);
    expect(result).toEqual({
      actionName: 'create_project',
      input: { name: 'GymPro' },
    });
  });

  it('resumes create_project when user replies with project name after clarify', () => {
    const actions = [action('create_project', ['name'])];
    const history = [
      msg('user', 'Help me with create project'),
      msg('assistant', 'What would you like to name the new project?'),
    ];

    const result = resolveActionFollowUp('GymPro', history, actions);
    expect(result).toEqual({
      actionName: 'create_project',
      input: { name: 'GymPro' },
    });
  });

  it('resumes create_project on affirmation after LLM ready message', () => {
    const actions = [action('create_project', ['name'])];
    const history = [
      msg('user', 'Help me with create project'),
      msg('assistant', 'What would you like to name the new project?'),
      msg('user', 'GymPro'),
      msg(
        'assistant',
        'Ready to run "create_project" in your application with the validated parameters below.',
      ),
    ];

    const result = resolveActionFollowUp('go for it', history, actions);
    expect(result).toEqual({
      actionName: 'create_project',
      input: { name: 'GymPro' },
    });
  });

  it('returns null when there is no prior clarify or ready message', () => {
    const history = [msg('user', 'hello'), msg('assistant', 'Hi there!')];
    expect(resolveActionFollowUp('bob@demo.com', history, userActions)).toBeNull();
  });

  it('resumes delete_project on yes after ready when title was in first message', () => {
    const actions: ActionData[] = [
      {
        ...action('delete_project', ['title']),
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', title: 'Title' },
          },
          required: ['title'],
        },
      },
    ];
    const history = [
      msg('user', 'Help me with delete project. I need the title: konga'),
      msg(
        'assistant',
        'Ready to run "delete_project" in your application with the validated parameters below.',
      ),
    ];

    const result = resolveActionFollowUp('yes', history, actions);
    expect(result).toEqual({
      actionName: 'delete_project',
      input: { title: 'konga' },
    });
  });

  it('does not hijack a new create_project request during delete_project clarify', () => {
    const actions: ActionData[] = [
      {
        ...action('delete_project', ['title']),
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', title: 'Title' },
          },
          required: ['title'],
        },
      },
      {
        ...action('create_project', ['name']),
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Project name' },
          },
          required: ['name'],
        },
      },
    ];
    const history = [
      msg('user', 'delete project GymPro'),
      msg('assistant', 'To delete project, I still need: title.'),
    ];

    expect(
      resolveActionFollowUp(
        'Help me with create project, its name is GymPro',
        history,
        actions,
      ),
    ).toBeNull();
  });

  it('resumes delete_project when user resends starter with title filled in', () => {
    const actions: ActionData[] = [
      {
        ...action('delete_project', ['title']),
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', title: 'Title' },
          },
          required: ['title'],
        },
      },
    ];
    const history = [
      msg('user', 'Help me with delete project. I need the title: konga'),
      msg('assistant', 'To delete project, I still need: title.'),
    ];

    const result = resolveActionFollowUp(
      'Help me with delete project. I need the title: GymPro',
      history,
      actions,
    );
    expect(result).toEqual({
      actionName: 'delete_project',
      input: { title: 'GymPro' },
    });
  });
});
