import type {
  PlaygroundActionDefinition,
  PlaygroundAppPage,
  PlaygroundSdkExtras,
} from './types';

export const DEFAULT_PLAYGROUND_APP_PAGES: PlaygroundAppPage[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    route: '/dashboard',
    description: 'Overview of the demo SaaS application.',
  },
  {
    id: 'users',
    title: 'Users',
    route: '/users',
    description: 'Manage demo application users — add, update, delete, and list.',
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/settings',
    description: 'Application settings and preferences.',
  },
];

export const DEFAULT_PLAYGROUND_ACTIONS: PlaygroundActionDefinition[] = [
  {
    name: 'add_user',
    enabled: true,
    description:
      'Create a new user in the demo app (email and optional display name).',
  },
  {
    name: 'delete_user',
    enabled: true,
    description: 'Remove a user from the demo app by email.',
  },
  {
    name: 'update_user',
    enabled: true,
    description: 'Update a demo user display name by email.',
  },
  {
    name: 'list_users',
    enabled: true,
    description: 'List all users currently in the demo app.',
  },
];

export const DEFAULT_PLAYGROUND_SDK: PlaygroundSdkExtras = {
  enforceActionAllowlist: true,
  voiceInput: false,
  voiceOutput: false,
  allowedActionNames: DEFAULT_PLAYGROUND_ACTIONS.map((action) => action.name),
};
