import type {
  AppPageLinkManifestEntry,
  AppPageManifestEntry,
  HostContext,
} from '@ahmedrioueche/actocore-shared';
import type { RequestContextData } from '@ahmedrioueche/actocore-shared';
import { resolveCurrentPageTitle } from './current-page-question.util';
import { buildAppSitemapBlock } from './app-sitemap.util';

/**
 * Base system instructions so the assistant stays scoped to the host application.
 * Project-specific `settings.systemPrompt` is appended when present.
 */
export function buildAppAssistantSystemPrompt(
  context: RequestContextData,
  enabledActionNames: string[],
  options?: {
    hostContext?: HostContext;
    appPages?: AppPageManifestEntry[];
    pageLinks?: AppPageLinkManifestEntry[];
  },
): string {
  const lines = [
    `You are the in-app assistant for "${context.projectName}".`,
    'You ONLY help users with this application: product questions, how to use features, and in-app actions the user runs from the chat widget.',
    'Do NOT answer off-topic requests (general knowledge, recipes, news, homework, unrelated coding, other products, etc.).',
    'If the request is unrelated, politely decline in one or two sentences and remind the user what you can help with inside this app.',
    'Never pretend to be a general-purpose ChatGPT-style assistant.',
    'When the user asks what pages, screens, or routes the app has, list every entry from Application pages below.',
    'When the user asks what page or screen they are on, answer from Current user context and Application pages — never say you lack documentation for that.',
    'Container pages (marked [container]) are grouping nodes on the product map only — never tell the user they are on a container page.',
    'NEVER claim an in-app action ran, succeeded, or failed — the host app runs actions only when the user clicks Run on the action card in the chat widget.',
    'NEVER say you are "running" an action or that something was "successfully created/updated/deleted" unless the user already clicked Run and your host app reported the result.',
    'When parameters for an action are still missing, ask for them briefly — do not say an action is ready or waiting for Run.',
    'Format replies with Markdown. For grouped features or topics, use bold section titles on their own line (e.g. **Feature area**: …) instead of bullet lists with asterisks.',
  ];

  const sitemap = buildAppSitemapBlock(options?.appPages, options?.pageLinks);
  if (sitemap) {
    lines.push('', sitemap);
  }

  const hostBlock = formatHostContextBlock(options?.hostContext, options?.appPages);
  if (hostBlock) {
    lines.push('', hostBlock);
  }

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

export { buildAppSitemapBlock } from './app-sitemap.util';

export function formatHostContextBlock(
  hostContext?: HostContext,
  appPages?: AppPageManifestEntry[],
): string | null {
  if (!hostContext) {
    return null;
  }

  const parts: string[] = [];

  if (hostContext.currentPage?.trim()) {
    const title = resolveCurrentPageTitle(hostContext, appPages);
    if (title) {
      parts.push(`Current page: ${title} (id: ${hostContext.currentPage.trim()})`);
    } else {
      parts.push(`Current page id: ${hostContext.currentPage.trim()}`);
    }
  }
  if (hostContext.route?.trim()) {
    parts.push(`Route: ${hostContext.route.trim()}`);
  }
  if (hostContext.selectedEntity) {
    const entity = hostContext.selectedEntity;
    const label = entity.label ? ` "${entity.label}"` : '';
    parts.push(
      `Selected ${entity.type}${label} (id: ${entity.id})`,
    );
  }
  if (hostContext.openModal?.trim()) {
    parts.push(`Open modal: ${hostContext.openModal.trim()}`);
  }
  if (hostContext.userRole?.trim()) {
    parts.push(`User role: ${hostContext.userRole.trim()}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return ['Current user context:', ...parts.map((p) => `- ${p}`)].join('\n');
}
