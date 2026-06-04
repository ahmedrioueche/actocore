import type { UsageEventData } from '@ahmedrioueche/actocore-shared';

const CSV_HEADERS = [
  'id',
  'projectId',
  'route',
  'intent',
  'model',
  'promptTokens',
  'completionTokens',
  'apiKeyId',
  'createdAt',
] as const;

function escapeCsvCell(value: string | number | undefined): string {
  if (value == null) {
    return '';
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function usageEventsToCsv(rows: UsageEventData[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.projectId,
        row.route,
        row.intent,
        row.model,
        row.promptTokens,
        row.completionTokens,
        row.apiKeyId,
        row.createdAt,
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

/** Rough OpenAI-style token estimate from character count. */
export function estimateTokensFromText(charCount: number): number {
  return Math.ceil(charCount / 4);
}
