/** Actions registered on the ActoCore Studio Assistant platform project. */
export const STUDIO_ASSISTANT_ACTIONS = [
  {
    name: 'create_project',
    description:
      'Create a new ActoCore project in the current workspace and open it in Studio.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, title: 'Project name' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
];
