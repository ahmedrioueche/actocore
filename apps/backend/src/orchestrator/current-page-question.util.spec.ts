import {
  buildCurrentPageAnswer,
  buildAppPagesListAnswer,
  isAppPagesListQuestion,
  isCurrentPageQuestion,
} from './current-page-question.util';

describe('current-page-question.util', () => {
  it('detects current-page questions', () => {
    expect(isCurrentPageQuestion('what page am I on?')).toBe(true);
    expect(isCurrentPageQuestion('where am I')).toBe(true);
    expect(isCurrentPageQuestion('What is ActoCore?')).toBe(false);
  });

  it('detects app pages list questions', () => {
    expect(isAppPagesListQuestion('what pages does this app have?')).toBe(true);
    expect(isAppPagesListQuestion('list all pages')).toBe(true);
    expect(isAppPagesListQuestion('what page am I on?')).toBe(false);
  });

  it('lists configured app pages', () => {
    expect(
      buildAppPagesListAnswer([
        {
          id: 'users',
          title: 'Users',
          route: '/users',
          description: 'Manage users',
        },
        {
          id: 'settings',
          title: 'Settings',
          route: '/settings',
        },
      ]),
    ).toContain('**Users** (`/users`)');
    expect(buildAppPagesListAnswer([])).toContain('App layout');
  });

  it('builds an answer from host context and app pages', () => {
    expect(
      buildCurrentPageAnswer(
        { currentPage: 'knowledge', route: '/projects/p1/knowledge' },
        [
          {
            id: 'knowledge',
            title: 'Knowledge',
            route: '/projects/:projectId/knowledge',
            description: 'Manage knowledge sources.',
          },
        ],
      ),
    ).toBe(
      "You're on **Knowledge** (`/projects/p1/knowledge`). Manage knowledge sources.",
    );
  });

  it('title-cases slug when app layout has no entry', () => {
    expect(
      buildCurrentPageAnswer(
        { currentPage: 'sdk_config', route: '/projects/p1/sdk-config' },
        [],
      ),
    ).toBe("You're on **Sdk Config** (`/projects/p1/sdk-config`).");
  });
});
