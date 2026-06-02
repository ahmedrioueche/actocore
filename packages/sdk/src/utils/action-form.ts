import type { ActionData, ActionInputSchema } from '@ahmedrioueche/actocore-shared';

export type ActionFormField = {
  key: string;
  label: string;
  required: boolean;
  inputType: 'text' | 'email';
};

export function getActionFormFields(schema: ActionInputSchema): ActionFormField[] {
  const properties = schema.properties as
    | Record<string, { type?: string; format?: string; title?: string }>
    | undefined;

  if (!properties) {
    return [];
  }

  const required = new Set(
    Array.isArray(schema.required) ? schema.required.map(String) : [],
  );

  return Object.entries(properties).map(([key, prop]) => ({
    key,
    label: prop.title ?? key.replace(/_/g, ' '),
    required: required.has(key),
    inputType: prop.format === 'email' ? 'email' : 'text',
  }));
}

export function buildActionUserMessage(
  action: Pick<ActionData, 'name'>,
  values: Record<string, string>,
): string {
  const email = values.email?.trim();
  const name = values.name?.trim();

  switch (action.name) {
    case 'add_user':
      if (email && name) {
        return `Add user ${email} named ${name}`;
      }
      if (email) {
        return `Add user ${email}`;
      }
      break;
    case 'delete_user':
      if (email) {
        return `Delete user with email ${email}`;
      }
      break;
    case 'update_user':
      if (email && name) {
        return `Update user with email ${email}, make their name ${name}`;
      }
      if (email) {
        return `Update user with email ${email}`;
      }
      break;
    case 'list_users':
      return 'Show all users';
    default:
      break;
  }

  const payload = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v.trim().length > 0),
  );
  return `Run ${action.name} ${JSON.stringify(payload)}`;
}

export function isActionFormComplete(
  fields: ActionFormField[],
  values: Record<string, string>,
): boolean {
  return fields
    .filter((f) => f.required)
    .every((f) => (values[f.key] ?? '').trim().length > 0);
}
