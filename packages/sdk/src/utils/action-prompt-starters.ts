import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { getActionFormFields } from './action-form';

type ActionPromptSource = Pick<ActionData, 'name' | 'description' | 'inputSchema'>;

/** Inserts a composer starter from input schema — not hardcoded demo copy. */
export function getActionPromptStarter(action: ActionPromptSource): string {
  const fields = getActionFormFields(action.inputSchema);
  if (fields.length > 0) {
    const phrase = action.name.replace(/_/g, ' ');
    if (fields.length === 1) {
      const field = fields[0]!;
      return `Help me with ${phrase}. I need the ${field.label.toLowerCase()}: `;
    }
    const labels = fields.map((field) => field.label.toLowerCase()).join(' and ');
    return `Help me with ${phrase}. I need ${labels}: `;
  }

  const description = action.description?.trim();
  if (description) {
    return description.endsWith(' ') ? description : `${description} `;
  }

  return `Help me with ${action.name.replace(/_/g, ' ')}`;
}

export function formatActionShortcutLabel(actionName: string): string {
  return actionName.replace(/_/g, ' ');
}
