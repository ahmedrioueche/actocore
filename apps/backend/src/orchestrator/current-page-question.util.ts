import type { AppPageManifestEntry, HostContext } from '@ahmedrioueche/actocore-shared';

/** True when the user is asking about their current screen / route. */
export function isCurrentPageQuestion(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) {
    return false;
  }

  if (/\bwhere am i\b/.test(text)) {
    return true;
  }
  if (/\bcurrent (page|screen|view|location)\b/.test(text)) {
    return true;
  }
  if (/\bwhat page\b/.test(text) || /\bwhich page\b/.test(text)) {
    return true;
  }

  return (
    /\b(what|which)\s+(page|screen|view|section)\b/.test(text) &&
    /\b(on|am i|is this|are we|here)\b/.test(text)
  );
}

function slugToTitle(slug: string): string {
  return slug
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveCurrentPageTitle(
  hostContext: HostContext | undefined,
  appPages?: AppPageManifestEntry[],
): string | undefined {
  const slug = hostContext?.currentPage?.trim();
  if (!slug) {
    return undefined;
  }

  const page = appPages?.find((entry) => entry.id === slug);
  return page?.title ?? slugToTitle(slug);
}

/** Builds a direct answer from live host context (no RAG required). */
export function buildCurrentPageAnswer(
  hostContext: HostContext | undefined,
  appPages?: AppPageManifestEntry[],
): string | null {
  if (!hostContext?.currentPage?.trim() && !hostContext?.route?.trim()) {
    return null;
  }

  const title = resolveCurrentPageTitle(hostContext, appPages);
  const route = hostContext.route?.trim();
  const page = hostContext.currentPage?.trim()
    ? appPages?.find((entry) => entry.id === hostContext.currentPage?.trim())
    : undefined;
  const description = page?.description?.trim();

  if (title && route) {
    let reply = `You're on **${title}** (\`${route}\`).`;
    if (description) {
      reply += ` ${description}`;
    }
    return reply;
  }

  if (title) {
    return `You're on **${title}**.`;
  }

  if (route) {
    return `You're at \`${route}\`. This route is not mapped to a named page in App layout yet.`;
  }

  return null;
}
