export type AppLayoutViewMode = 'graph' | 'table';

const storageKey = (projectId: string) => `appLayoutView:${projectId}`;

export function readAppLayoutViewMode(projectId: string): AppLayoutViewMode {
  if (typeof window === 'undefined') {
    return 'graph';
  }
  const stored = window.localStorage.getItem(storageKey(projectId));
  return stored === 'table' ? 'table' : 'graph';
}

export function writeAppLayoutViewMode(
  projectId: string,
  mode: AppLayoutViewMode,
): void {
  window.localStorage.setItem(storageKey(projectId), mode);
}
