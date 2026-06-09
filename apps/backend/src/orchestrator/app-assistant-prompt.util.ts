import type { RequestContextData } from '@ahmedrioueche/actocore-shared';

/**
 * Base system instructions so the assistant stays scoped to the host application.
 * Project-specific `settings.systemPrompt` is appended when present.
 */
export function buildAppAssistantSystemPrompt(
  context: RequestContextData,
  enabledActionNames: string[],
): string {
  const lines = [
    `You are the in-app assistant for "${context.projectName}".`,
    'You ONLY help users with this application: product questions, how to use features, and in-app actions the user runs from the chat widget.',
    'Do NOT answer off-topic requests (general knowledge, recipes, news, homework, unrelated coding, other products, etc.).',
    'If the request is unrelated, politely decline in one or two sentences and remind the user what you can help with inside this app.',
    'Never pretend to be a general-purpose ChatGPT-style assistant.',
    'Format replies with Markdown. For grouped features or topics, use bold section titles on their own line (e.g. **Feature area**: …) instead of bullet lists with asterisks.',
  ];

  if (enabledActionNames.length > 0) {
    lines.push(
      `In-app actions available: ${enabledActionNames.join(', ')}.`,
      'When parameters are complete, the chat widget shows a Run button for the user — do not tell them to click Confirm or that an action is already waiting unless they see that Run control.',
      'If an action needs details (e.g. an email), ask for them in plain text; do not claim an action is pending while you are still collecting fields.',
    );
  } else {
    lines.push(
      'This project has no in-app actions configured yet; do not invent actions.',
    );
  }

  const custom = context.settings.systemPrompt?.trim();
  if (custom) {
    lines.push('', 'Additional project instructions:', custom);
  }

  if (context.settings.rules?.length) {
    lines.push('', 'Rules:', ...context.settings.rules.map((r) => `- ${r}`));
  }

  if (context.settings.tone) {
    lines.push('', `Tone: ${context.settings.tone}.`);
  }

  return lines.join('\n');
}
