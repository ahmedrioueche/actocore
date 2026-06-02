/** Conversation starters — user completes details in their own words, then AI confirms. */
const STARTERS: Record<string, string> = {
  add_user: 'Add a new user with email ',
  delete_user: 'Delete the user with email ',
  update_user: 'Update the user with email , set their name to ',
  list_users: 'Show all users',
};

export function getActionPromptStarter(actionName: string): string {
  return STARTERS[actionName] ?? `Help me with ${actionName.replace(/_/g, ' ')}`;
}

export function formatActionShortcutLabel(actionName: string): string {
  return actionName.replace(/_/g, ' ');
}
