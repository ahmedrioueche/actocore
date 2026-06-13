import type { ErrorObject } from 'ajv';
import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

export interface ActionValidationIssue {
  field: string;
  label: string;
  message: string;
}

function fieldLabel(
  schema: ActionInputSchema,
  field: string,
): string {
  const properties = schema.properties as
    | Record<string, { title?: string; description?: string }>
    | undefined;
  const prop = properties?.[field];
  if (prop?.title) {
    return prop.title;
  }
  return field.replace(/_/g, ' ');
}

/** Params implied by built-in handlers when Studio schema is empty or incomplete. */
const KNOWN_ACTION_FIELDS: Record<
  string,
  Record<string, { type: string; title?: string }>
> = {
  create_project: {
    name: { type: 'string', title: 'Project name' },
  },
};

/** Schema used for validation — merges known handler params missing from Studio. */
export function effectiveInputSchema(
  schema: ActionInputSchema,
  actionName?: string,
): ActionInputSchema {
  const known = actionName ? KNOWN_ACTION_FIELDS[actionName] : undefined;
  if (!known) {
    return schema;
  }

  const props =
    schema.properties &&
    typeof schema.properties === 'object' &&
    !Array.isArray(schema.properties)
      ? { ...(schema.properties as Record<string, unknown>) }
      : {};

  let changed = false;
  for (const [field, fieldSchema] of Object.entries(known)) {
    if (!(field in props)) {
      props[field] = fieldSchema;
      changed = true;
    }
  }

  if (!changed) {
    return schema;
  }

  const required = effectiveRequiredFields(schema, actionName);
  return {
    ...schema,
    type: 'object',
    properties: props,
    ...(required.length > 0 ? { required } : {}),
  };
}

/** Fields that must be present before showing the Run card. */
export function effectiveRequiredFields(
  schema: ActionInputSchema,
  actionName?: string,
): string[] {
  if (Array.isArray(schema.required) && schema.required.length > 0) {
    return schema.required.map(String);
  }

  const props = schema.properties;
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    const keys = Object.keys(props as Record<string, unknown>);
    if (keys.length === 1) {
      return keys;
    }
  }

  if (actionName && KNOWN_ACTION_FIELDS[actionName]) {
    return Object.keys(KNOWN_ACTION_FIELDS[actionName]);
  }

  return [];
}

export function missingRequiredFieldIssues(
  schema: ActionInputSchema,
  input: Record<string, unknown>,
  isMeaningfulValue?: (value: string) => boolean,
  actionName?: string,
): ActionValidationIssue[] {
  const hasValue = (value: unknown): boolean => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }
      return isMeaningfulValue ? isMeaningfulValue(trimmed) : true;
    }
    return true;
  };

  return effectiveRequiredFields(schema, actionName)
    .filter((field) => !hasValue(input[field]))
    .map((field) => {
      const label = fieldLabel(schema, field);
      return {
        field,
        label,
        message: `${label} is required`,
      };
    });
}

export function formatActionValidationIssues(
  schema: ActionInputSchema,
  errors: ErrorObject[],
): ActionValidationIssue[] {
  const issues: ActionValidationIssue[] = [];
  const seen = new Set<string>();

  for (const error of errors) {
    if (error.keyword === 'required' && error.params.missingProperty) {
      const field = String(error.params.missingProperty);
      if (seen.has(field)) continue;
      seen.add(field);
      const label = fieldLabel(schema, field);
      issues.push({
        field,
        label,
        message: `${label} is required`,
      });
      continue;
    }

    const path = error.instancePath?.replace(/^\//, '') || '';
    if (path && !seen.has(path)) {
      seen.add(path);
      const label = fieldLabel(schema, path);
      issues.push({
        field: path,
        label,
        message: error.message ? `${label}: ${error.message}` : `${label} is invalid`,
      });
    }
  }

  return issues;
}

function isOnlyMissingRequired(errors: ErrorObject[]): boolean {
  return (
    errors.length > 0 &&
    errors.every((error) => error.keyword === 'required')
  );
}

/** Conversational follow-up when the user chose an action but omitted required fields. */
export function formatClarifyingQuestion(
  actionName: string,
  issues: ActionValidationIssue[],
): string {
  if (issues.length === 1 && issues[0].field === 'email') {
    switch (actionName) {
      case 'delete_user':
        return 'Which user should I delete? Please share their email address.';
      case 'add_user':
        return 'What email should I use for the new user?';
      case 'update_user':
        return 'Which user should I update? Please share their email address.';
      default:
        break;
    }
  }

  if (issues.length === 1 && issues[0].field === 'name') {
    switch (actionName) {
      case 'create_project':
        return 'What would you like to name the new project?';
      default:
        break;
    }
  }

  if (
    issues.length === 2 &&
    issues.some((i) => i.field === 'email') &&
    issues.some((i) => i.field === 'name') &&
    actionName === 'update_user'
  ) {
    return 'Which user should I update? Please share their email and the new display name.';
  }

  const fields = issues.map((i) => i.label.toLowerCase()).join(' and ');
  return `To ${actionName.replace(/_/g, ' ')}, I still need: ${fields}.`;
}

export function formatActionValidationSummary(
  actionName: string,
  schema: ActionInputSchema,
  errors: ErrorObject[],
): { content: string; error: string; issues: ActionValidationIssue[] } {
  const issues = formatActionValidationIssues(schema, errors);

  if (issues.length === 0) {
    const fallback = errors.map((e) => e.message ?? 'Invalid input').join('; ');
    return {
      content: `Could not run "${actionName}": ${fallback}`,
      error: fallback,
      issues: [],
    };
  }

  const bulletList = issues.map((i) => `• ${i.message}`).join('\n');
  const content = [
    `I need a bit more information before I can run "${actionName}".`,
    '',
    'Please provide:',
    bulletList,
  ].join('\n');

  return {
    content,
    error: issues.map((i) => i.message).join('; '),
    issues,
  };
}
