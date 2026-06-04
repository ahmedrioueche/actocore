import type { SessionMessageData } from '@ahmedrioueche/actocore-shared';
import {
  extractEmailFromMessage,
  extractNaturalLanguageActionInput,
} from './natural-language-action.util';

export interface ActionFollowUpResolution {
  actionName: string;
  input: Record<string, unknown>;
}

/** Assistant copy from ActionRunnerService when input validates. */
const READY_TO_RUN_PREFIX = /^Ready to run "/i;

const AFFIRMATION =
  /^\s*(yes|yeah|yep|ok(?:\s+go)?|okay|go|confirm|proceed|sure|do it|run it|please do|go ahead)\s*[.!]?$/i;

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
];

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
  return null;
}

function parseReadyToRunAction(content: string): string | null {
  const match = content.match(/Ready to run "([^"]+)"/i);
  return match?.[1] ?? null;
}

function collectEmailsFromUserMessages(
  history: SessionMessageData[],
  beforeIndex: number,
): string[] {
  const emails: string[] = [];
  for (let i = beforeIndex - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry.role !== 'user') {
      continue;
    }
    const email = extractEmailFromMessage(entry.content);
    if (email && !emails.includes(email)) {
      emails.push(email);
    }
  }
  return emails;
}

/**
 * Resume an in-app action across turns (clarify → email, or confirm → run).
 * Call with session history **before** appending the current user message.
 */
export function resolveActionFollowUp(
  message: string,
  history: SessionMessageData[],
  enabledActionNames: string[],
): ActionFollowUpResolution | null {
  const trimmed = message.trim();
  if (!trimmed || history.length === 0) {
    return null;
  }

  const last = history[history.length - 1];
  if (last.role !== 'assistant') {
    return null;
  }

  const lastIndex = history.length - 1;

  if (isEmailOnlyMessage(trimmed)) {
    const actionName = findClarifyingAction(last.content, enabledActionNames);
    if (!actionName) {
      return null;
    }
    const email = extractEmailFromMessage(trimmed)!;
    return {
      actionName,
      input: extractNaturalLanguageActionInput(
        `${actionName} ${email}`,
        actionName,
      ),
    };
  }

  if (!AFFIRMATION.test(trimmed)) {
    return null;
  }

  let actionName = findClarifyingAction(last.content, enabledActionNames);
  if (!actionName && READY_TO_RUN_PREFIX.test(last.content)) {
    actionName = parseReadyToRunAction(last.content);
  }

  if (!actionName || !enabledActionNames.includes(actionName)) {
    return null;
  }

  const emails = collectEmailsFromUserMessages(history, lastIndex);
  if (emails.length === 0) {
    return null;
  }

  const primaryEmail = emails[0];
  return {
    actionName,
    input: extractNaturalLanguageActionInput(
      `${actionName} ${primaryEmail}`,
      actionName,
    ),
  };
}
