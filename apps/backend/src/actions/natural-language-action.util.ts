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

export function extractEmailFromMessage(message: string): string | undefined {
  const match = message.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase();
}

export function extractNameFromMessage(message: string): string | undefined {
  const patterns = [
    /\bmake\s+(?:their|the|this)\s+name\s+(?:to\s+)?["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\bchange\s+(?:their|the|this)\s+name\s+(?:to\s+)?["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
    /\b(?:name|called)\s+(?:is|to|:)\s*["']?([^"'\n,.]+?)["']?(?:\s*$|[,.])/i,
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

export function extractNaturalLanguageActionInput(
  message: string,
  actionName: string,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const email = extractEmailFromMessage(message);
  const name = extractNameFromMessage(message);

  if (email) {
    input.email = email;
  }
  if (name) {
    input.name = name;
  }

  if (actionName === 'list_users') {
    return {};
  }

  return input;
}
