import type { HostContext } from '@ahmedrioueche/actocore-shared';

const PROJECT_SEGMENT_PAGES: Record<string, string> = {
  docs: 'docs',
  knowledge: 'knowledge',
  actions: 'actions',
  layout: 'layout',
  'sdk-config': 'sdk_config',
  'api-keys': 'api_keys',
  usage: 'usage',
  settings: 'settings',
};

/** Maps Studio routes to semantic page ids for the product assistant. */
export function resolveStudioHostContext(pathname: string): HostContext {
  const route = pathname;

  if (pathname === '/projects') {
    return { currentPage: 'projects', route };
  }

  const projectRoot = pathname.match(/^\/projects\/[^/]+$/);
  if (projectRoot) {
    return { currentPage: 'overview', route };
  }

  const segmentMatch = pathname.match(/^\/projects\/[^/]+\/([^/]+)/);
  const segment = segmentMatch?.[1];
  if (segment) {
    return {
      currentPage: PROJECT_SEGMENT_PAGES[segment] ?? segment.replace(/-/g, '_'),
      route,
    };
  }

  const workspaceMatch = pathname.match(/^\/([^/]+)/);
  const workspace = workspaceMatch?.[1];
  if (workspace && !workspace.startsWith('auth')) {
    return { currentPage: workspace.replace(/-/g, '_'), route };
  }

  return { route };
}
