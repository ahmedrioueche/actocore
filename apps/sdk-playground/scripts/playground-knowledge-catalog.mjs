/** Demo knowledge sources for SDK playground Q&A / RAG testing. */
export const PLAYGROUND_KNOWLEDGE = [
  {
    type: 'text',
    title: 'ActoCore overview',
    content: [
      'ActoCore is an AI integration layer for web applications.',
      'It provides an embeddable React SDK with chat, knowledge-based Q&A, and in-app actions.',
      'Developers configure a project API key; the backend classifies user messages into Knowledge (Q&A), Action, or Direct reply modes.',
    ].join(' '),
  },
  {
    type: 'text',
    title: 'SDK Playground demo users',
    content: [
      'The SDK Playground is a local host app that demonstrates the ActoCore chat widget.',
      'It includes a demo users table. Supported actions: add_user, delete_user, update_user, and list_users.',
      'To add a user, use natural language or run add_user with email and name.',
      'To list users, ask to list users or run list_users.',
      'Knowledge questions should start with words like What, How, or Tell me so the assistant uses project documentation.',
    ].join(' '),
  },
];
