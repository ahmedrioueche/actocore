import { create } from 'zustand';

import { collectDescendantPageIdsFromPages } from '@/utils/app-layout-page-tree';

const storageKey = (projectId: string) => `appLayoutGraphCollapse:${projectId}`;

function readStored(projectId: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeStored(projectId: string, pageIds: string[]) {
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(pageIds));
}

interface AppLayoutGraphCollapseState {
  collapsedByProject: Record<string, string[]>;
  ensureProjectLoaded: (projectId: string) => void;
  isCollapsed: (projectId: string, pageId: string) => boolean;
  toggleCollapsed: (projectId: string, pageId: string) => void;
  getHiddenPageIds: (
    projectId: string,
    pages: { id: string; parentPageId?: string | null }[],
  ) => Set<string>;
}

export const useAppLayoutGraphCollapseStore =
  create<AppLayoutGraphCollapseState>((set, get) => ({
    collapsedByProject: {},
    ensureProjectLoaded: (projectId) => {
      if (get().collapsedByProject[projectId]) {
        return;
      }
      set((state) => ({
        collapsedByProject: {
          ...state.collapsedByProject,
          [projectId]: readStored(projectId),
        },
      }));
    },
    isCollapsed: (projectId, pageId) =>
      (get().collapsedByProject[projectId] ?? readStored(projectId)).includes(
        pageId,
      ),
    toggleCollapsed: (projectId, pageId) => {
      const current = get().collapsedByProject[projectId] ?? readStored(projectId);
      const next = current.includes(pageId)
        ? current.filter((id) => id !== pageId)
        : [...current, pageId];
      writeStored(projectId, next);
      set((state) => ({
        collapsedByProject: {
          ...state.collapsedByProject,
          [projectId]: next,
        },
      }));
    },
    getHiddenPageIds: (projectId, pages) => {
      const collapsed = get().collapsedByProject[projectId] ?? readStored(projectId);
      const hidden = new Set<string>();
      for (const pageId of collapsed) {
        for (const descendantId of collectDescendantPageIdsFromPages(
          pageId,
          pages,
        )) {
          hidden.add(descendantId);
        }
      }
      return hidden;
    },
  }));
