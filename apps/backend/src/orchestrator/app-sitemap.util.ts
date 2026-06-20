import type {
  AppPageKind,
  AppPageLinkManifestEntry,
  AppPageManifestEntry,
} from '@ahmedrioueche/actocore-shared';

function formatSitemapPageLine(
  page: AppPageManifestEntry,
  indent: number,
): string {
  const prefix = '  '.repeat(indent);
  const kindLabel = page.pageKind === 'container' ? ' [container]' : '';
  const routePart =
    page.pageKind === 'container' ? '' : ` (${page.route})`;
  const desc = page.description?.trim();
  const base = `${prefix}- ${page.id}${kindLabel}${routePart}: ${page.title}`;
  return desc ? `${base} — ${desc}` : base;
}

function buildSitemapTreeLines(
  pages: AppPageManifestEntry[],
  parentSlug: string | null,
  indent: number,
  slugToPage: Map<string, AppPageManifestEntry>,
  childrenByParentSlug: Map<string, string[]>,
): string[] {
  const childSlugs =
    parentSlug === null
      ? pages.filter((page) => !page.parentPageSlug).map((page) => page.id)
      : (childrenByParentSlug.get(parentSlug) ?? []);

  const lines: string[] = [];
  for (const slug of [...childSlugs].sort()) {
    const page = slugToPage.get(slug);
    if (!page) {
      continue;
    }
    lines.push(formatSitemapPageLine(page, indent));
    lines.push(
      ...buildSitemapTreeLines(
        pages,
        slug,
        indent + 1,
        slugToPage,
        childrenByParentSlug,
      ),
    );
  }
  return lines;
}

function formatNavigationLinkLine(
  link: AppPageLinkManifestEntry,
  slugByPageId: Map<string, string>,
): string {
  const source = slugByPageId.get(link.sourcePageId) ?? link.sourcePageId;
  const target = slugByPageId.get(link.targetPageId) ?? link.targetPageId;
  const label = link.label?.trim();
  return label ? `- ${source} → ${target} (${label})` : `- ${source} → ${target}`;
}

export function buildAppSitemapBlock(
  pages?: AppPageManifestEntry[],
  pageLinks?: AppPageLinkManifestEntry[],
): string | null {
  if (!pages?.length) {
    return null;
  }

  const slugToPage = new Map(pages.map((page) => [page.id, page] as const));
  const childrenByParentSlug = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.parentPageSlug) {
      continue;
    }
    const siblings = childrenByParentSlug.get(page.parentPageSlug) ?? [];
    siblings.push(page.id);
    childrenByParentSlug.set(page.parentPageSlug, siblings);
  }

  const lines = [
    'Application pages (container nodes group screens — they are not navigable destinations):',
    ...buildSitemapTreeLines(
      pages,
      null,
      0,
      slugToPage,
      childrenByParentSlug,
    ),
  ];

  if (pageLinks?.length) {
    const slugByPageId = new Map(
      pages
        .filter((page) => page.pageId)
        .map((page) => [page.pageId!, page.id] as const),
    );
    lines.push(
      'Page navigation (explicit user paths only):',
      ...pageLinks.map((link) =>
        formatNavigationLinkLine(link, slugByPageId),
      ),
    );
  }

  return lines.join('\n');
}

export function isContainerPageKind(pageKind?: AppPageKind): boolean {
  return pageKind === 'container';
}
