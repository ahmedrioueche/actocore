/** Action definitions registered in Core for the SDK playground project. */
export const PLAYGROUND_ACTIONS = [
  {
    name: 'add_user',
    description: 'Create a new user in the demo app (email and optional display name).',
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
