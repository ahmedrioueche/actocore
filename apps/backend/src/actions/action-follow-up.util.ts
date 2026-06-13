import type { ActionData, SessionMessageData } from '@ahmedrioueche/actocore-shared';
import { effectiveRequiredFields } from './action-validation-message.util';
import {
  extractEmailFromMessage,
  extractBareScalarValue,
  extractLabeledFieldValue,
  extractNaturalLanguageActionInput,
  extractTrailingActionValue,
  findPrimaryActionMatch,
  isExplicitActionCommand,
  isLikelyActionMessage,
  isMeaningfulActionFieldValue,
  matchesNaturalLanguageAction,
  messageSuppliesActionFieldValues,
} from './natural-language-action.util';

export interface ActionFollowUpResolution {
  actionName: string;
  input: Record<string, unknown>;
}

/** Assistant copy from ActionRunnerService when input validates. */
const READY_TO_RUN_PREFIX = /^Ready to run "/i;

const AFFIRMATION =
  /^\s*(yes|yeah|yep|ok(?:ay)?(?:\s+go)?|go(?:\s+for\s+it)?|confirm|proceed|sure|do it|run it|please do|go ahead|okey)\s*[.!]?$/i;

const CLARIFY_BY_ACTION: { actionName: string; pattern: RegExp }[] = [
  {
    actionName: 'delete_user',
    pattern: /which user should i delete/i,
  },
  {
    actionName: 'add_user',
    pattern: /what email should i use for the new user/i,
  },
  {
    actionName: 'update_user',
    pattern: /which user should i update/i,
  },
  {
    actionName: 'create_project',
    pattern: /what would you like to name the new project/i,
  },
];

function enabledNames(actions: ActionData[]): string[] {
  return actions.map((action) => action.name);
}

function isEmailOnlyMessage(message: string): boolean {
  const email = extractEmailFromMessage(message);
  if (!email) {
    return false;
  }
  const remainder = message
    .replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
    .replace(/[\s,.:;!?-]/g, '');
  return remainder.length === 0;
}

function findClarifyingAction(
  assistantContent: string,
  enabledActionNames: string[],
): string | null {
  const lower = assistantContent.toLowerCase();
  for (const { actionName, pattern } of CLARIFY_BY_ACTION) {
    if (enabledActionNames.includes(actionName) && pattern.test(lower)) {
      return actionName;
    }
  }

  const stillNeed = lower.match(/to ([a-z0-9_ -]+), i still need:/i);
  if (stillNeed?.[1]) {
    const slug = stillNeed[1].trim().replace(/\s+/g, '_');
    const match = enabledActionNames.find((name) => name === slug);
    if (match) {
      return match;
    }
  }

  return null;
}

function parseReadyToRunAction(content: string): string | null {
  const match = content.match(/Ready to run "([^"]+)"/i);
  return match?.[1] ?? null;
}

function isAssistantCollectingParams(content: string): boolean {
  if (READY_TO_RUN_PREFIX.test(content)) {
    return false;
  }

  if (findClarifyingAction(content, CLARIFY_BY_ACTION.map((entry) => entry.actionName))) {
    return true;
  }

  const lower = content.toLowerCase();
  return (
    /\bi still need:/i.test(content) ||
    /\bwhat would you like to name\b/i.test(lower) ||
    /\bplease (share|provide|give)\b/i.test(lower) ||
    (content.includes('?') &&
      /\b(name|email|project|title|value)\b/i.test(lower))
  );
}

function findRecentActionName(
  history: SessionMessageData[],
  enabledActions: ActionData[],
  beforeIndex: number,
): string | null {
  const names = enabledNames(enabledActions);
  for (let i = beforeIndex - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry.role !== 'user') {
      continue;
    }
    for (const action of enabledActions) {
      if (matchesNaturalLanguageAction(entry.content, action.name)) {
        return action.name;
      }
    }
    for (const name of names) {
      if (entry.content.toLowerCase().includes(name.replace(/_/g, ' '))) {
        return name;
      }
    }
  }
  return null;
}

function collectUserMessages(
  history: SessionMessageData[],
  beforeIndex: number,
  includeCurrent?: string,
): string[] {
  const lines: string[] = [];
  for (let i = 0; i < beforeIndex; i += 1) {
    if (history[i]?.role === 'user') {
      lines.push(history[i]!.content);
    }
  }
  if (includeCurrent?.trim()) {
    lines.push(includeCurrent.trim());
  }
  return lines;
}

function rebuildInputFromConversation(
  actionName: string,
  action: ActionData | undefined,
  userLines: string[],
): Record<string, unknown> {
  const combined = userLines.join('\n');
  let input = extractNaturalLanguageActionInput(
    combined,
    actionName,
    action?.inputSchema,
  );

  if (action) {
    input = fillSingleMissingFieldFromLastLine(action, input, userLines);
  }

  return input;
}

function fillSingleMissingFieldFromLastLine(
  action: ActionData,
  input: Record<string, unknown>,
  userLines: string[],
): Record<string, unknown> {
  const required = effectiveRequiredFields(action.inputSchema, action.name);
  const missing = required.filter((field) => {
    const value = input[field];
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return !trimmed || !isMeaningfulActionFieldValue(trimmed);
    }
    return false;
  });

  if (missing.length !== 1) {
    return input;
  }

  const lastLine = userLines[userLines.length - 1]?.trim();
  if (!lastLine) {
    return input;
  }

  const field = missing[0]!;
  const prop = (action.inputSchema.properties as Record<string, { title?: string }> | undefined)?.[field];

  if (field === 'email') {
    const email = extractEmailFromMessage(lastLine);
    if (email) {
      return { ...input, email };
    }
    return input;
  }

  const labeled = extractLabeledFieldValue(lastLine, field, prop?.title);
  if (labeled && isMeaningfulActionFieldValue(labeled)) {
    return { ...input, [field]: labeled };
  }

  const fromNl = extractNaturalLanguageActionInput(
    lastLine,
    action.name,
    action.inputSchema,
  );
  if (fromNl[field] !== undefined && fromNl[field] !== '') {
    return { ...input, [field]: fromNl[field] };
  }

  const scalar = extractNaturalLanguageActionInput(
    `${action.name} ${lastLine}`,
    action.name,
    action.inputSchema,
  );
  if (scalar[field] !== undefined && scalar[field] !== '') {
    return { ...input, [field]: scalar[field] };
  }

  const bare = extractBareScalarValue(lastLine);
  if (bare && isMeaningfulActionFieldValue(bare)) {
    return { ...input, [field]: bare };
  }

  const trailing = extractTrailingActionValue(lastLine, action.name);
  if (trailing && isMeaningfulActionFieldValue(trailing)) {
    return { ...input, [field]: trailing };
  }

  return input;
}

function isParameterOnlyReply(
  message: string,
  enabledActionNames: string[],
  collectingAction?: ActionData,
): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 120) {
    return false;
  }
  if (AFFIRMATION.test(trimmed) || isExplicitActionCommand(trimmed)) {
    return false;
  }
  if (
    collectingAction &&
    messageSuppliesActionFieldValues(trimmed, collectingAction)
  ) {
    return true;
  }
  if (isLikelyActionMessage(trimmed, enabledActionNames)) {
    return false;
  }
  return true;
}

function resolveParameterReply(
  message: string,
  history: SessionMessageData[],
  enabledActions: ActionData[],
): ActionFollowUpResolution | null {
  const last = history[history.length - 1];
  if (!last || last.role !== 'assistant') {
    return null;
  }

  const names = enabledNames(enabledActions);
  const lastIndex = history.length - 1;

  if (isEmailOnlyMessage(message)) {
    const actionName = findClarifyingAction(last.content, names);
    if (!actionName) {
      return null;
    }
    const action = enabledActions.find((entry) => entry.name === actionName);
    const userLines = collectUserMessages(history, lastIndex, message);
    return {
      actionName,
      input: rebuildInputFromConversation(actionName, action, userLines),
    };
  }

  if (!isAssistantCollectingParams(last.content)) {
    return null;
  }

  const actionNamePreview =
    findClarifyingAction(last.content, names) ??
    findRecentActionName(history, enabledActions, lastIndex);

  const switchedAction = findPrimaryActionMatch(message, enabledActions);
  if (
    actionNamePreview &&
    switchedAction &&
    switchedAction !== actionNamePreview
  ) {
    return null;
  }

  const previewAction = actionNamePreview
    ? enabledActions.find((entry) => entry.name === actionNamePreview)
    : undefined;

  if (!isParameterOnlyReply(message, names, previewAction)) {
    return null;
  }

  const actionName = actionNamePreview;

  if (!actionName) {
    return null;
  }

  const action = enabledActions.find((entry) => entry.name === actionName);
  const userLines = collectUserMessages(history, lastIndex, message);

  return {
    actionName,
    input: rebuildInputFromConversation(actionName, action, userLines),
  };
}

function resolveAffirmationFollowUp(
  message: string,
  history: SessionMessageData[],
  enabledActions: ActionData[],
): ActionFollowUpResolution | null {
  if (!AFFIRMATION.test(message.trim())) {
    return null;
  }

  const last = history[history.length - 1];
  if (!last || last.role !== 'assistant') {
    return null;
  }

  const names = enabledNames(enabledActions);
  const lastIndex = history.length - 1;

  let actionName = findClarifyingAction(last.content, names);
  if (!actionName && READY_TO_RUN_PREFIX.test(last.content)) {
    actionName = parseReadyToRunAction(last.content);
  }
  if (!actionName) {
    actionName = findRecentActionName(history, enabledActions, lastIndex);
  }

  if (!actionName || !names.includes(actionName)) {
    return null;
  }

  const action = enabledActions.find((entry) => entry.name === actionName);
  const userLines = collectUserMessages(history, lastIndex);

  return {
    actionName,
    input: rebuildInputFromConversation(actionName, action, userLines),
  };
}

/**
 * Resume an in-app action across turns (clarify → value, or confirm → run card).
 * Call with session history **before** appending the current user message.
 */
export function resolveActionFollowUp(
  message: string,
  history: SessionMessageData[],
  enabledActions: ActionData[],
): ActionFollowUpResolution | null {
  const trimmed = message.trim();
  if (!trimmed || history.length === 0 || enabledActions.length === 0) {
    return null;
  }

  return (
    resolveParameterReply(trimmed, history, enabledActions) ??
    resolveAffirmationFollowUp(trimmed, history, enabledActions)
  );
}
