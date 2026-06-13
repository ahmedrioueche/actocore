import type { ActionData, ActionInputSchema } from '@ahmedrioueche/actocore-shared';
import { effectiveRequiredFields } from './action-validation-message.util';

/** Maps action slugs to natural-language cues end users typically type. */
const ACTION_LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  add_user: [
    /\b(?:add|creat\w*|register|invite)\w*\b[\s\S]{0,80}\busers?\b/i,
    /\busers?\b[\s\S]{0,40}\b(?:add|creat\w*|register|invite)\w*\b/i,
  ],
  delete_user: [
    /\b(?:delete|delte|delet|remove|remov)\w*\b[\s\S]{0,80}\busers?\b/i,
    /\busers?\b[\s\S]{0,40}\b(?:delete|delte|delet|remove)\w*\b/i,
  ],
  update_user: [
    /\b(update|change|rename|edit|modify)\b[\s\S]{0,80}\busers?\b/i,
    /\busers?\b[\s\S]{0,40}\b(update|change|rename|edit|modify)\b/i,
    /\bmake\s+(?:their|the|this)\s+name\b/i,
    /\bchange\s+(?:their|the|this)\s+name\b/i,
  ],
  list_users: [
    /\b(list|show|display|view)\b[\s\S]{0,40}\busers?\b/i,
    /\busers?\b[\s\S]{0,20}\b(list|show|display|view)\b/i,
  ],
  create_project: [
    /\b(?:create|add|new|start)\b[\s\S]{0,50}\bprojects?\b/i,
    /\bprojects?\b[\s\S]{0,50}\b(?:create|add|new|start)\b/i,
    /\bhelp me with create project\b/i,
  ],
  delete_project: [
    /\b(?:delete|remove)\b[\s\S]{0,50}\bprojects?\b/i,
    /\bprojects?\b[\s\S]{0,50}\b(?:delete|remove)\b/i,
    /\bhelp me with delete project\b/i,
  ],
};

const EXPLICIT_ACTION_PATTERN =
  /^\s*(run|execute|call|trigger|perform|do)\b/i;

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/i;

const DELETE_VERB = /\b(?:delete|delte|delet|remove|remov)\w*\b/i;
const ADD_VERB = /\b(?:add|creat\w*|register|invite)\w*\b/i;
const UPDATE_VERB = /\b(?:update|change|rename|edit|modify)\b/i;

function matchesVerbWithEmail(
  message: string,
  verb: RegExp,
): boolean {
  return verb.test(message) && EMAIL_PATTERN.test(message);
}

export function isExplicitActionCommand(message: string): boolean {
  return EXPLICIT_ACTION_PATTERN.test(message.trim());
}

export function matchesNaturalLanguageAction(
  message: string,
  actionName: string,
): boolean {
  const lower = message.toLowerCase();
  if (lower.includes(actionName.toLowerCase())) {
    return true;
  }

  if (actionName === 'delete_user' && matchesVerbWithEmail(message, DELETE_VERB)) {
    return true;
  }
  if (actionName === 'add_user' && matchesVerbWithEmail(message, ADD_VERB)) {
    return true;
  }
  if (actionName === 'update_user' && matchesVerbWithEmail(message, UPDATE_VERB)) {
    return true;
  }

  const patterns = ACTION_LANGUAGE_PATTERNS[actionName];
  if (!patterns) {
    return false;
  }

  return patterns.some((pattern) => pattern.test(message));
}

export function isLikelyActionMessage(
  message: string,
  enabledActionNames: string[],
): boolean {
  if (isExplicitActionCommand(message)) {
    return true;
  }

  return enabledActionNames.some((name) =>
    matchesNaturalLanguageAction(message, name),
  );
}

/** Best action slug when the user starts a new request mid-collection. */
export function findPrimaryActionMatch(
  message: string,
  enabledActions: ActionData[],
): string | null {
  const matches = enabledActions.filter((action) =>
    matchesNaturalLanguageAction(message, action.name),
  );
  if (matches.length === 0) {
    return null;
  }
  if (matches.length === 1) {
    return matches[0]!.name;
  }

  const lower = message.toLowerCase();
  const explicit = matches.find((action) => lower.includes(action.name));
  return explicit?.name ?? matches[0]!.name;
}

/** Value after the action phrase: `delete project GymPro` → `GymPro`. */
export function extractTrailingActionValue(
  message: string,
  actionName: string,
): string | undefined {
  const humanPhrase = actionName.replace(/_/g, ' ');
  const pattern = new RegExp(
    `\\b${escapeRegExp(humanPhrase).replace(/\s+/g, '\\s+')}\\s+["']?([^"'\\n,.!?]+?)["']?(?:\\s*$|[,.!?])`,
    'i',
  );
  const match = message.match(pattern);
  const value = match?.[1]?.trim();
  if (value && isMeaningfulActionFieldValue(value)) {
    return value;
  }
  return undefined;
}

export function extractEmailFromMessage(message: string): string | undefined {
  const match = message.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase();
}

export function extractNameFromMessage(message: string): string | undefined {
  const patterns = [
    /\bmake\s+(?:their|the|this)\s+name\s+(?:to\s+)?["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\bchange\s+(?:their|the|this)\s+name\s+(?:to\s+)?["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\b(?:name|called)\s+(?:is|to|:)\s*["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\bits\s+name\s+is\s+["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\bnamed\s+["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\bwith\s+name\s+["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

const GENERIC_ACTION_VALUE_TOKENS = new Set([
  'a',
  'an',
  'add',
  'create',
  'delete',
  'help',
  'me',
  'my',
  'new',
  'please',
  'project',
  'projects',
  'start',
  'the',
  'title',
  'with',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fieldLabelVariants(field: string, title?: string): string[] {
  const variants = new Set<string>();
  variants.add(field.replace(/_/g, ' '));
  variants.add(field);
  if (title?.trim()) {
    variants.add(title.trim());
  }
  return [...variants];
}

/** Reads `title: GymPro`, `I need the title My project`, etc. */
export function extractLabeledFieldValue(
  message: string,
  field: string,
  title?: string,
): string | undefined {
  for (const label of fieldLabelVariants(field, title)) {
    const escaped = escapeRegExp(label);
    const patterns = [
      new RegExp(
        `\\b(?:the\\s+)?${escaped}\\s*[:=]\\s*["']?([^"'\\n,.!?]+?)["']?(?:\\s*$|[,.!?])`,
        'i',
      ),
      new RegExp(
        `\\bi\\s+need\\s+(?:the\\s+)?${escaped}\\s+["']?([^"'\\n,.!?]+?)["']?(?:\\s*$|[,.!?])`,
        'i',
      ),
      new RegExp(
        `\\b(?:the\\s+)?${escaped}\\s+["']?([^"'\\n,.!?]+?)["']?(?:\\s*$|[,.!?])`,
        'i',
      ),
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      const value = match?.[1]?.trim();
      if (!value) {
        continue;
      }
      if (value.toLowerCase() === label.toLowerCase()) {
        continue;
      }
      return value;
    }
  }

  return undefined;
}

function schemaProperties(
  schema?: ActionInputSchema,
): Record<string, { title?: string }> {
  if (!schema?.properties || typeof schema.properties !== 'object') {
    return {};
  }
  return schema.properties as Record<string, { title?: string }>;
}

/** Rejects intent words mistaken for parameter values (e.g. name = "create"). */
export function isMeaningfulActionFieldValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length < 2) {
    return false;
  }
  return !GENERIC_ACTION_VALUE_TOKENS.has(normalized);
}

export function extractBareScalarValue(message: string): string | undefined {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 80) {
    return undefined;
  }

  if (
    /^(yes|yeah|yep|no|ok|okay|go|sure|thanks|please|run it|do it|go for it)$/i.test(
      trimmed,
    )
  ) {
    return undefined;
  }

  const quoted = trimmed.match(/^["']([^"']+)["']$/);
  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }

  if (EMAIL_PATTERN.test(trimmed)) {
    return undefined;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1 && /^[\w.-]+$/i.test(tokens[0]!)) {
    return tokens[0]!;
  }

  return undefined;
}

export function extractNaturalLanguageActionInput(
  message: string,
  actionName: string,
  schema?: ActionInputSchema,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const email = extractEmailFromMessage(message);
  const name = extractNameFromMessage(message);

  if (email) {
    input.email = email;
  }
  if (name && isMeaningfulActionFieldValue(name)) {
    input.name = name;
  }

  if (actionName === 'list_users') {
    return {};
  }

  for (const [field, prop] of Object.entries(schemaProperties(schema))) {
    if (input[field] !== undefined) {
      continue;
    }
    const value = extractLabeledFieldValue(message, field, prop.title);
    if (value && isMeaningfulActionFieldValue(value)) {
      input[field] = value;
    }
  }

  const schemaFieldKeys = Object.keys(schemaProperties(schema));
  const schemaHasName = 'name' in schemaProperties(schema);

  if (!input.name && (schemaHasName || schemaFieldKeys.length === 0)) {
    const projectMatch = message.match(
      /\b(?:project|called|named)\s+(?:called|named\s+)?["']?([^"'\n,.!?]+?)["']?(?:\s*$|[,.!?])/i,
    );
    const candidate = projectMatch?.[1]?.trim();
    if (candidate && isMeaningfulActionFieldValue(candidate)) {
      input.name = candidate;
    }
  }

  if (schemaFieldKeys.length === 1) {
    const field = schemaFieldKeys[0]!;
    if (input[field] === undefined) {
      const trailing = extractTrailingActionValue(message, actionName);
      if (trailing) {
        input[field] = trailing;
      }
    }
    if (input[field] === undefined) {
      const bare = extractBareScalarValue(message);
      if (bare && isMeaningfulActionFieldValue(bare)) {
        input[field] = bare;
      }
    }
  } else if (!input.name && /project/i.test(actionName)) {
    const bare = extractBareScalarValue(message);
    if (bare && isMeaningfulActionFieldValue(bare)) {
      input.name = bare;
    }
  }

  return input;
}

export function messageSuppliesActionFieldValues(
  message: string,
  action: Pick<ActionData, 'name' | 'inputSchema'>,
): boolean {
  const extracted = extractNaturalLanguageActionInput(
    message,
    action.name,
    action.inputSchema,
  );
  const schemaFields = Object.keys(schemaProperties(action.inputSchema));
  const relevantFields =
    effectiveRequiredFields(action.inputSchema, action.name).length > 0
      ? effectiveRequiredFields(action.inputSchema, action.name)
      : schemaFields;

  return relevantFields.some((field) => {
    const value = extracted[field];
    if (typeof value !== 'string') {
      return false;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 && isMeaningfulActionFieldValue(trimmed);
  });
}
