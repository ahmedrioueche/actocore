function runKey(sessionId: string, messageId: string): string {
  return `${sessionId}:${messageId}`;
}

const completedActionRuns = new Set<string>();

export function markActionRunComplete(
  sessionId: string,
  messageId: string,
): void {
  completedActionRuns.add(runKey(sessionId, messageId));
}

export function isActionRunComplete(
  sessionId: string,
  messageId: string,
): boolean {
  return completedActionRuns.has(runKey(sessionId, messageId));
}

export function clearActionRunsForSession(sessionId: string): void {
  const prefix = `${sessionId}:`;
  for (const key of completedActionRuns) {
    if (key.startsWith(prefix)) {
      completedActionRuns.delete(key);
    }
  }
}
