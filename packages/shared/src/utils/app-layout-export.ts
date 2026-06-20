import type { ActionData } from '../types/action';
import type { AppPageData, AppPageLinkData } from '../types/app-page';
import type {
  AppLayoutExportLink,
  AppLayoutExportPage,
  AppLayoutExportV1,
} from '../types/app-layout-export';
import { APP_LAYOUT_EXPORT_FORMAT_VERSION } from '../types/app-layout-export';
import { wouldCreatePageHierarchyCycle } from './app-page-hierarchy';

export interface BuildAppLayoutExportOptions {
  includeActionAssignments?: boolean;
  exportedAt?: string;
}

export interface AppLayoutExportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Builds a portable app layout export from Studio/API data. */
export function buildAppLayoutExport(
  pages: AppPageData[],
  links: AppPageLinkData[],
  actions: ActionData[] | undefined,
  options?: BuildAppLayoutExportOptions,
): AppLayoutExportV1 {
  const slugById = new Map(pages.map((page) => [page.id, page.slug] as const));
  const actionNameById = new Map(
    (actions ?? []).map((action) => [action.id, action.name] as const),
  );

  const exportPages: AppLayoutExportPage[] = pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    route: page.route,
    pageKind: page.pageKind,
    description: page.description,
    enabled: page.enabled,
    order: page.order,
    parentPageSlug: page.parentPageId
      ? (slugById.get(page.parentPageId) ?? null)
      : null,
    graphPosition: page.graphPosition,
    functionalities: page.functionalities?.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      linkedActionName: entry.linkedActionId
        ? actionNameById.get(entry.linkedActionId)
        : undefined,
    })),
  }));

  const exportLinks: AppLayoutExportLink[] = links.map((link) => ({
    sourceSlug: slugById.get(link.sourcePageId) ?? link.sourcePageId,
    targetSlug: slugById.get(link.targetPageId) ?? link.targetPageId,
    label: link.label,
  }));

  const result: AppLayoutExportV1 = {
    formatVersion: APP_LAYOUT_EXPORT_FORMAT_VERSION,
    exportedAt: options?.exportedAt ?? new Date().toISOString(),
    pages: exportPages,
    links: exportLinks,
  };

  if (options?.includeActionAssignments && actions?.length) {
    const assignments: Record<string, string[]> = {};
    for (const page of pages) {
      const names = actions
        .filter((action) => action.pageIds?.includes(page.id))
        .map((action) => action.name)
        .sort();
      if (names.length > 0) {
        assignments[page.slug] = names;
      }
    }
    if (Object.keys(assignments).length > 0) {
      result.actionAssignments = assignments;
    }
  }

  return result;
}

export function parseAppLayoutExportJson(raw: string): AppLayoutExportV1 {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON: expected an object');
  }
  return parsed as AppLayoutExportV1;
}

export function sortAppLayoutPagesTopologically(
  pages: AppLayoutExportPage[],
): AppLayoutExportPage[] {
  const slugSet = new Set(pages.map((page) => page.slug));
  const bySlug = new Map(pages.map((page) => [page.slug, page] as const));
  const visited = new Set<string>();
  const sorted: AppLayoutExportPage[] = [];

  const visit = (slug: string) => {
    if (visited.has(slug)) {
      return;
    }
    visited.add(slug);
    const page = bySlug.get(slug);
    if (!page) {
      return;
    }
    const parent = page.parentPageSlug?.trim();
    if (parent && slugSet.has(parent)) {
      visit(parent);
    }
    sorted.push(page);
  };

  for (const page of pages) {
    visit(page.slug);
  }

  return sorted;
}

export function validateAppLayoutExport(
  layout: AppLayoutExportV1,
): AppLayoutExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (layout.formatVersion !== APP_LAYOUT_EXPORT_FORMAT_VERSION) {
    errors.push(
      `Unsupported formatVersion "${layout.formatVersion as string}" (expected ${APP_LAYOUT_EXPORT_FORMAT_VERSION})`,
    );
  }

  if (!Array.isArray(layout.pages)) {
    errors.push('pages must be an array');
    return { valid: false, errors, warnings };
  }

  if (!Array.isArray(layout.links)) {
    errors.push('links must be an array');
    return { valid: false, errors, warnings };
  }

  const slugCounts = new Map<string, number>();
  for (const page of layout.pages) {
    slugCounts.set(page.slug, (slugCounts.get(page.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push(`Duplicate page slug "${slug}"`);
    }
  }

  const slugSet = new Set(layout.pages.map((page) => page.slug));

  for (const page of layout.pages) {
    const pageKind = page.pageKind ?? 'screen';
    if (pageKind === 'container' && !page.description?.trim()) {
      errors.push(`Container page "${page.slug}" requires a description`);
    }

    const parent = page.parentPageSlug?.trim();
    if (parent && !slugSet.has(parent)) {
      errors.push(
        `Page "${page.slug}" references unknown parentPageSlug "${parent}"`,
      );
    }
    if (parent === page.slug) {
      errors.push(`Page "${page.slug}" cannot be its own parent`);
    }
  }

  const parentMap = new Map<string, string | null>();
  for (const page of layout.pages) {
    parentMap.set(page.slug, page.parentPageSlug?.trim() ?? null);
  }
  for (const page of layout.pages) {
    if (
      wouldCreatePageHierarchyCycle(
        page.slug,
        page.parentPageSlug?.trim() ?? null,
        parentMap,
      )
    ) {
      errors.push(`Page hierarchy cycle detected at "${page.slug}"`);
    }
  }

  for (const link of layout.links) {
    if (!slugSet.has(link.sourceSlug)) {
      errors.push(
        `Link references unknown sourceSlug "${link.sourceSlug}"`,
      );
    }
    if (!slugSet.has(link.targetSlug)) {
      errors.push(
        `Link references unknown targetSlug "${link.targetSlug}"`,
      );
    }
    if (link.sourceSlug === link.targetSlug) {
      errors.push(
        `Link cannot connect page "${link.sourceSlug}" to itself`,
      );
    }
  }

  if (layout.actionAssignments) {
    for (const slug of Object.keys(layout.actionAssignments)) {
      if (!slugSet.has(slug)) {
        warnings.push(
          `actionAssignments references unknown page slug "${slug}"`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
