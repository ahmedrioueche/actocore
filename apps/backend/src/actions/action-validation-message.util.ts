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
