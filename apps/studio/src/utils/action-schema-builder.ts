import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

import { ACTION_NAME_PATTERN } from '@/constants/actions';

export type ActionParameterType = 'string' | 'number' | 'boolean';

export interface ActionParameterField {
  id: string;
  name: string;
  type: ActionParameterType;
  description?: string;
  required: boolean;
}

const PARAM_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

let fieldIdCounter = 0;

/** Stable local id for React list keys. */
export function createParameterFieldId(): string {
  fieldIdCounter += 1;
  return `param-${fieldIdCounter}`;
}

export function createEmptyParameterField(): ActionParameterField {
  return {
    id: createParameterFieldId(),
    name: '',
    type: 'string',
    description: '',
    required: false,
  };
}

/** Convert free text into a valid action slug (best effort). */
export function slugifyActionName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 64)
    .replace(/^[^a-z]/, 'a');
}

export function isValidParameterName(name: string): boolean {
  return PARAM_NAME_PATTERN.test(name.trim());
}

export function validateParameterFields(
  fields: ActionParameterField[],
): string | null {
  const names = new Set<string>();

  for (const field of fields) {
    const trimmed = field.name.trim();
    if (!trimmed) {
      continue;
    }
    if (!isValidParameterName(trimmed)) {
      return 'invalidName';
    }
    if (names.has(trimmed)) {
      return 'duplicateName';
    }
    names.add(trimmed);
  }

  return null;
}

/** Build a JSON Schema object from the visual parameter list. */
export function fieldsToInputSchema(
  fields: ActionParameterField[],
): ActionInputSchema {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const field of fields) {
    const name = field.name.trim();
    if (!name) {
      continue;
    }

    const prop: Record<string, unknown> = { type: field.type };
    const description = field.description?.trim();
    if (description) {
      prop.description = description;
    }
    properties[name] = prop;

    if (field.required) {
      required.push(name);
    }
  }

  const schema: ActionInputSchema = {
    type: 'object',
    properties,
    additionalProperties: false,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

function isSupportedPropertyType(
  value: unknown,
): value is ActionParameterType {
  return value === 'string' || value === 'number' || value === 'boolean';
}

/**
 * Best-effort reverse parse for edit mode.
 * Returns null when the schema uses unsupported shapes (nested objects, arrays, etc.).
 */
export function inputSchemaToFields(
  schema: ActionInputSchema,
): ActionParameterField[] | null {
  if (schema.type !== 'object' || typeof schema.properties !== 'object') {
    return null;
  }

  const properties = schema.properties as Record<string, unknown>;
  const requiredSet = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((r): r is string => typeof r === 'string')
      : [],
  );

  const fields: ActionParameterField[] = [];

  for (const [name, rawProp] of Object.entries(properties)) {
    if (!rawProp || typeof rawProp !== 'object' || Array.isArray(rawProp)) {
      return null;
    }

    const prop = rawProp as Record<string, unknown>;
    if (!isSupportedPropertyType(prop.type)) {
      return null;
    }

    fields.push({
      id: createParameterFieldId(),
      name,
      type: prop.type,
      description:
        typeof prop.description === 'string' ? prop.description : '',
      required: requiredSet.has(name),
    });
  }

  return fields;
}

/** Resolve the final input schema from simple builder or advanced JSON text. */
export function resolveInputSchema(options: {
  advancedMode: boolean;
  schemaText: string;
  fields: ActionParameterField[];
}): { ok: true; value: ActionInputSchema } | { ok: false; error: string } {
  if (options.advancedMode) {
    try {
      const parsed = JSON.parse(options.schemaText) as unknown;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return { ok: false, error: 'invalidSchema' };
      }
      return { ok: true, value: parsed as ActionInputSchema };
    } catch {
      return { ok: false, error: 'invalidSchema' };
    }
  }

  const fieldError = validateParameterFields(options.fields);
  if (fieldError) {
    return { ok: false, error: fieldError };
  }

  return { ok: true, value: fieldsToInputSchema(options.fields) };
}

export function suggestActionNameFromDescription(description: string): string {
  const slug = slugifyActionName(description);
  if (slug && ACTION_NAME_PATTERN.test(slug)) {
    return slug;
  }
  return slug ? slug.replace(/^[^a-z]/, 'a') : '';
}

/** Extract simple parameter types from a stored input schema. */
export function actionInputSchemaToParameters(
  schema: ActionInputSchema,
): { name: string; type: ActionParameterType }[] | null {
  const fields = inputSchemaToFields(schema);
  if (fields === null) {
    return null;
  }

  return fields
    .filter((field) => field.name.trim())
    .map((field) => ({
      name: field.name.trim(),
      type: field.type,
    }));
}

function buildActionHandlerBody(
  actionName: string,
  parameters: { name: string; type: ActionParameterType }[] | null,
): string {
  if (parameters === null) {
    return `async (input: Record<string, unknown>) => {
      // TODO: implement ${actionName}
    }`;
  }

  if (parameters.length === 0) {
    return `async () => {
      // TODO: implement ${actionName}
    }`;
  }

  const typeLines = parameters
    .map((parameter) => `      ${parameter.name}: ${parameter.type};`)
    .join('\n');

  return `async (input: {
${typeLines}
    }) => {
      // TODO: implement ${actionName}
    }`;
}

export function buildSdkHandlerSnippet(
  actionName: string,
  parameters: { name: string; type: ActionParameterType }[],
): string {
  const handler = buildActionHandlerBody(actionName, parameters);

  return `<ActocoreProvider
  actions={{
    ${actionName}: ${handler},
  }}
>`;
}

export interface SdkIntegrationAction {
  name: string;
  inputSchema: ActionInputSchema;
  enabled: boolean;
}

/** Full React component snippet for all enabled project actions. */
export function buildSdkIntegrationCode(actions: SdkIntegrationAction[]): string {
  const enabledActions = actions.filter((action) => action.enabled);
  const allowlist = enabledActions.map((action) => `'${action.name}'`).join(', ');

  const handlers = enabledActions
    .map((action) => {
      const parameters = actionInputSchemaToParameters(action.inputSchema);
      const handler = buildActionHandlerBody(action.name, parameters);
      return `    ${action.name}: ${handler},`;
    })
    .join('\n\n');

  return `import { ActocoreProvider, ActoChat } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';

export function ActocoreAssistant() {
  return (
    <ActocoreProvider
      apiKey={import.meta.env.VITE_ACTOCORE_API_KEY}
      security={{
        allowedActionNames: [${allowlist}],
        enforceActionAllowlist: true,
      }}
      actions={{
${handlers}
      }}
    >
      <ActoChat />
    </ActocoreProvider>
  );
}
`;
}
