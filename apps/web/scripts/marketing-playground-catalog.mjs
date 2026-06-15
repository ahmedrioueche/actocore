/** ActoCore product knowledge for the public marketing hero chat only. */
export const MARKETING_HERO_KNOWLEDGE = [
  {
    type: 'text',
    title: 'ActoCore overview',
    content: [
      'ActoCore is an AI integration layer for web applications.',
      'It provides an embeddable React SDK with chat, knowledge-based Q&A, and in-app actions.',
      'Developers configure a project in Studio; the SDK classifies messages into Knowledge, Action, or Direct reply modes.',
    ].join(' '),
  },
  {
    type: 'text',
    title: 'ActoCore Studio overview',
    content: [
      'ActoCore Studio is where teams create projects, upload knowledge, define actions, configure the SDK, and issue API keys.',
      'The public playground lets visitors create their own isolated demo project without signing in.',
    ].join(' '),
  },
];

/** Default demo catalog seeded into each visitor playground project at bootstrap. */
export const PLAYGROUND_ACTIONS = [
  {
    name: 'add_user',
    description:
      'Create a new user in the demo app (email and optional display name).',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', title: 'Email address' },
        name: { type: 'string', minLength: 1, title: 'Display name' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_user',
    description: 'Remove a user from the demo app by email.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', title: 'Email address' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_user',
    description: 'Update a demo user display name by email.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', title: 'Email address' },
        name: { type: 'string', minLength: 1, title: 'Display name' },
      },
      required: ['email', 'name'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_users',
    description: 'List all users currently in the demo app.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];

export const PLAYGROUND_APP_PAGES = [
  {
    slug: 'dashboard',
    title: 'Dashboard',
    route: '/dashboard',
    description: 'Overview of the demo SaaS application.',
  },
  {
    slug: 'users',
    title: 'Users',
    route: '/users',
    description: 'Manage demo application users — add, update, delete, and list.',
  },
  {
    slug: 'settings',
    title: 'Settings',
    route: '/settings',
    description: 'Application settings and preferences.',
  },
];

export const PLAYGROUND_SDK_CONFIG = {
  ui: { showIntentBadge: true, showSources: true, showActionsHint: true },
  security: {
    allowedActionNames: ['add_user', 'delete_user', 'update_user', 'list_users'],
    enforceActionAllowlist: true,
  },
  voice: { input: false, output: false },
};
