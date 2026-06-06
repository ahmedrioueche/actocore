import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

/** Mirror of the backend `CreateActionDto` name rule (lowercase slug). */
export const ACTION_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

/** Example JSON Schema seeded into the create form to show the expected shape. */
export const DEFAULT_ACTION_INPUT_SCHEMA: ActionInputSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      description: "The customer's email address",
    },
  },
  required: ['email'],
  additionalProperties: false,
};

export const DEFAULT_ACTION_INPUT_SCHEMA_TEXT = JSON.stringify(
  DEFAULT_ACTION_INPUT_SCHEMA,
  null,
  2,
);

export interface ParsedInputSchema {
  ok: boolean;
  value?: ActionInputSchema;
}

/** Parse + validate the JSON the user typed for an action input schema. */
export function parseInputSchema(text: string): ParsedInputSchema {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { ok: false };
    }
    return { ok: true, value: parsed as ActionInputSchema };
  } catch {
    return { ok: false };
  }
}

export function formatInputSchema(schema: ActionInputSchema): string {
  return JSON.stringify(schema, null, 2);
}
