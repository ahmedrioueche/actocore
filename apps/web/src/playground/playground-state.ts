import {
  DEFAULT_PLAYGROUND_ACTIONS,
  DEFAULT_PLAYGROUND_APP_PAGES,
  DEFAULT_PLAYGROUND_SDK,
} from './defaults';
import type {
  PlaygroundActionDefinition,
  PlaygroundAppPage,
  PlaygroundManifestPage,
  PlaygroundSdkExtras,
  PlaygroundState,
} from './types';

const STORAGE_PREFIX = 'actocore-playground-state:';

export function createDefaultPlaygroundState(): PlaygroundState {
  return {
    appPages: DEFAULT_PLAYGROUND_APP_PAGES.map((page) => ({ ...page })),
    actions: DEFAULT_PLAYGROUND_ACTIONS.map((action) => ({ ...action })),
    sdk: { ...DEFAULT_PLAYGROUND_SDK },
  };
}

export function loadPlaygroundState(visitorId: string): PlaygroundState {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${visitorId}`);
    if (!raw) {
      return createDefaultPlaygroundState();
    }

    const parsed = JSON.parse(raw) as Partial<PlaygroundState>;
    const defaults = createDefaultPlaygroundState();

    return {
      appPages: normalizeAppPages(parsed.appPages, defaults.appPages),
      actions: normalizeActions(parsed.actions, defaults.actions),
      sdk: normalizeSdkSettings(parsed.sdk, defaults.sdk),
    };
  } catch {
    return createDefaultPlaygroundState();
  }
}

export function savePlaygroundState(visitorId: string, state: PlaygroundState): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}${visitorId}`, JSON.stringify(state));
}

export function toManifestPages(pages: PlaygroundAppPage[]): PlaygroundManifestPage[] {
  return pages.map((page) => ({
    id: page.id,
    title: page.title,
    route: page.route,
    description: page.description,
  }));
}

export function enabledActionNames(actions: PlaygroundActionDefinition[]): string[] {
  return actions.filter((action) => action.enabled).map((action) => action.name);
}

function normalizeAppPages(
  value: unknown,
  fallback: PlaygroundAppPage[],
): PlaygroundAppPage[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  const pages = value
    .map((item) => normalizeAppPage(item))
    .filter((page): page is PlaygroundAppPage => page !== null);

  return pages.length > 0 ? pages : fallback;
}

function normalizeAppPage(value: unknown): PlaygroundAppPage | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = stringField(record.id);
  const title = stringField(record.title);
  const route = stringField(record.route);
  if (!id || !title || !route) {
    return null;
  }

  return {
    id,
    title,
    route,
    description: stringField(record.description) ?? undefined,
  };
}

function normalizeActions(
  value: unknown,
  fallback: PlaygroundActionDefinition[],
): PlaygroundActionDefinition[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  const byName = new Map(fallback.map((action) => [action.name, { ...action }]));

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const name = stringField(record.name);
    if (!name || !byName.has(name)) continue;

    byName.set(name, {
      name,
      description: stringField(record.description) ?? byName.get(name)!.description,
      enabled: typeof record.enabled === 'boolean' ? record.enabled : true,
    });
  }

  return [...byName.values()];
}

function normalizeSdkSettings(
  value: unknown,
  fallback: PlaygroundSdkExtras,
): PlaygroundSdkExtras {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const allowed = Array.isArray(record.allowedActionNames)
    ? record.allowedActionNames.filter((item): item is string => typeof item === 'string')
    : fallback.allowedActionNames;

  return {
    enforceActionAllowlist: booleanField(
      record.enforceActionAllowlist,
      fallback.enforceActionAllowlist,
    ),
    voiceInput: booleanField(record.voiceInput, fallback.voiceInput),
    voiceOutput: booleanField(record.voiceOutput, fallback.voiceOutput),
    allowedActionNames:
      allowed.length > 0 ? allowed : fallback.allowedActionNames,
  };
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function booleanField(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function slugifyPageId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function createEmptyAppPage(index: number): PlaygroundAppPage {
  const id = `page-${index}`;
  return {
    id,
    title: `Page ${index}`,
    route: `/${id}`,
    description: '',
  };
}
