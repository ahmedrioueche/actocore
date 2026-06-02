import type { ActionData, ActionInputSchema } from '@ahmedrioueche/actocore-shared';

/** Fallback schemas when Core action list is unavailable (local dev / playground). */
export const DEMO_ACTION_SCHEMAS: Record<
  string,
  { description: string; inputSchema: ActionInputSchema }
> = {
  add_user: {
    description: 'Create a new user (email and optional display name).',
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
  delete_user: {
    description: 'Remove a user by email.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', title: 'Email address' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  update_user: {
    description: 'Update a user display name by email.',
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
  list_users: {
    description: 'List all users in the app.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
};

export function buildFallbackActions(handlerNames: string[]): ActionData[] {
  const now = new Date(0).toISOString();
  return handlerNames
    .filter((name) => DEMO_ACTION_SCHEMAS[name])
    .map((name) => {
      const meta = DEMO_ACTION_SCHEMAS[name];
      return {
        id: `local-${name}`,
        projectId: 'local',
        name,
        description: meta.description,
        inputSchema: meta.inputSchema,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      };
    });
}
