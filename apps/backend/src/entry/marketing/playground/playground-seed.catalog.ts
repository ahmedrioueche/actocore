/** Default demo catalog seeded into each visitor playground project. */
export const PLAYGROUND_DEFAULT_ACTIONS = [
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
] as const;

export const PLAYGROUND_DEFAULT_APP_PAGES = [
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
    description:
      'Manage demo application users — add, update, delete, and list.',
  },
  {
    slug: 'settings',
    title: 'Settings',
    route: '/settings',
    description: 'Application settings and preferences.',
  },
] as const;

export const PLAYGROUND_DEFAULT_SDK_CONFIG = {
  ui: { showIntentBadge: true, showSources: true, showActionsHint: true },
  security: {
    allowedActionNames: PLAYGROUND_DEFAULT_ACTIONS.map((action) => action.name),
    enforceActionAllowlist: true,
  },
  voice: { input: false, output: false },
} as const;
