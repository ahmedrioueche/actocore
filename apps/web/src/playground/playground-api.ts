import type {
  ActionData,
  ApiResponse,
  AppPageData,
  CreateActionDto,
  CreateAppPageDto,
  CreateKnowledgeSourceDto,
  KnowledgeSourceData,
  RuntimeConfigData,
  SdkProjectConfigData,
  UpdateActionDto,
  UpdateAppPageDto,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

import { getActocoreApiUrl } from '@/lib/marketing-chat';

import type { PlaygroundProjectCredentials } from './playground-project';

const API_PREFIX = '/v1/marketing/playground';

type PlaygroundApiContext = Pick<
  PlaygroundProjectCredentials,
  'projectId' | 'playgroundToken'
>;

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: ApiResponse<T> & { message?: string };
  try {
    json = text ? JSON.parse(text) : { success: false, message: text };
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }

  return json.data;
}

async function requestJson<T>(
  path: string,
  ctx: PlaygroundApiContext,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Playground-Token', ctx.playgroundToken);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${getActocoreApiUrl()}${path}`, {
    ...init,
    headers,
  });

  return parseApiResponse<T>(res);
}

export async function bootstrapPlaygroundProject(input: {
  visitorId: string;
  projectName: string;
}): Promise<PlaygroundProjectCredentials> {
  const res = await fetch(`${getActocoreApiUrl()}${API_PREFIX}/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = (await res.json()) as ApiResponse<PlaygroundProjectCredentials> & {
    message?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `Bootstrap failed (${res.status})`);
  }

  return json.data;
}

export function createPlaygroundApi(ctx: PlaygroundApiContext) {
  const base = `${API_PREFIX}/projects/${ctx.projectId}`;

  return {
    getRuntime: () => requestJson<RuntimeConfigData>(`${base}/runtime`, ctx),

    listActions: () => requestJson<ActionData[]>(`${base}/actions`, ctx),

    createAction: (body: CreateActionDto) =>
      requestJson<ActionData>(`${base}/actions`, ctx, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateAction: (actionId: string, body: UpdateActionDto) =>
      requestJson<ActionData>(`${base}/actions/${actionId}`, ctx, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    listAppPages: () => requestJson<AppPageData[]>(`${base}/app-pages`, ctx),

    createAppPage: (body: CreateAppPageDto) =>
      requestJson<AppPageData>(`${base}/app-pages`, ctx, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateAppPage: (pageId: string, body: UpdateAppPageDto) =>
      requestJson<AppPageData>(`${base}/app-pages/${pageId}`, ctx, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    deleteAppPage: (pageId: string) =>
      requestJson<{ message: string }>(`${base}/app-pages/${pageId}`, ctx, {
        method: 'DELETE',
      }),

    listKnowledge: () => requestJson<KnowledgeSourceData[]>(`${base}/knowledge`, ctx),

    createKnowledge: (body: CreateKnowledgeSourceDto) =>
      requestJson<KnowledgeSourceData>(`${base}/knowledge`, ctx, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    uploadKnowledge: async (file: File, title?: string) => {
      const form = new FormData();
      form.append('file', file);
      const query = title ? `?title=${encodeURIComponent(title)}` : '';
      return requestJson<KnowledgeSourceData>(
        `${base}/knowledge/upload${query}`,
        ctx,
        { method: 'POST', body: form },
      );
    },

    deleteKnowledge: (sourceId: string) =>
      requestJson<{ message: string }>(`${base}/knowledge/${sourceId}`, ctx, {
        method: 'DELETE',
      }),

    getSdkConfig: () => requestJson<SdkProjectConfigData>(`${base}/sdk-config`, ctx),

    updateSdkConfig: (body: UpdateSdkProjectConfigDto) =>
      requestJson<SdkProjectConfigData>(`${base}/sdk-config`, ctx, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  };
}

export type PlaygroundApi = ReturnType<typeof createPlaygroundApi>;

export function mapActionToPanel(action: ActionData) {
  return {
    id: action.id,
    name: action.name,
    description: action.description ?? '',
    enabled: action.enabled,
  };
}

export function mapAppPageToPanel(page: AppPageData) {
  return {
    backendId: page.id,
    id: page.slug,
    title: page.title,
    route: page.route,
    description: page.description,
  };
}
