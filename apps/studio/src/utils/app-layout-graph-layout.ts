import type { AppPageData, AppPageGraphPosition } from '@ahmedrioueche/actocore-shared';

const GRID_COLUMNS = 3;
const GAP_X = 320;
const GAP_Y = 240;
const ORIGIN_X = 80;
const ORIGIN_Y = 80;
const NODE_WIDTH = 288;
const SIBLING_GAP = 48;

export function resolveAppPageGraphPosition(
  page: AppPageData,
  autoIndex: number,
): AppPageGraphPosition {
  if (page.graphPosition) {
    return page.graphPosition;
  }

  const col = autoIndex % GRID_COLUMNS;
  const row = Math.floor(autoIndex / GRID_COLUMNS);

  return {
    x: ORIGIN_X + col * GAP_X,
    y: ORIGIN_Y + row * GAP_Y,
  };
}

function buildChildrenMap(
  pages: AppPageData[],
): Map<string, string[]> {
  const pageIds = new Set(pages.map((page) => page.id));
  const childrenByParent = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.parentPageId || !pageIds.has(page.parentPageId)) {
      continue;
    }
    const siblings = childrenByParent.get(page.parentPageId) ?? [];
    siblings.push(page.id);
    childrenByParent.set(page.parentPageId, siblings);
  }

  for (const [, children] of childrenByParent) {
    children.sort();
  }

  return childrenByParent;
}

function resolveFlatPagePosition(
  page: AppPageData,
  pages: AppPageData[],
  positions: Record<string, AppPageGraphPosition>,
  autoIndex: number,
): AppPageGraphPosition {
  const positioned = pages.filter(
    (entry) => entry.id !== page.id && positions[entry.id],
  );

  if (positioned.length === 0) {
    return resolveAppPageGraphPosition(page, autoIndex);
  }

  const yCounts = new Map<number, number>();
  for (const entry of positioned) {
    const y = positions[entry.id]!.y;
    yCounts.set(y, (yCounts.get(y) ?? 0) + 1);
  }

  let rowY = ORIGIN_Y;
  let bestCount = 0;
  for (const [y, count] of yCounts) {
    if (count > bestCount) {
      rowY = y;
      bestCount = count;
    }
  }

  let nextX = ORIGIN_X;
  for (const entry of positioned) {
    const pos = positions[entry.id]!;
    if (pos.y !== rowY) {
      continue;
    }
    nextX = Math.max(nextX, pos.x + NODE_WIDTH + SIBLING_GAP);
  }

  return { x: nextX, y: rowY };
}

function resolveChildPagePosition(
  childId: string,
  parentId: string,
  childrenByParent: Map<string, string[]>,
  positions: Record<string, AppPageGraphPosition>,
): AppPageGraphPosition {
  const parentPos = positions[parentId];
  if (!parentPos) {
    return { x: ORIGIN_X, y: ORIGIN_Y + GAP_Y };
  }

  const siblings = (childrenByParent.get(parentId) ?? []).filter(
    (id) => id !== childId && positions[id],
  );

  let x = parentPos.x;
  for (const siblingId of siblings) {
    const siblingPos = positions[siblingId]!;
    x = Math.max(x, siblingPos.x + NODE_WIDTH + SIBLING_GAP);
  }

  return {
    x,
    y: parentPos.y + GAP_Y,
  };
}

function assignSubtreePositions(
  pageId: string,
  fallbackX: number,
  fallbackY: number,
  pagesById: Map<string, AppPageData>,
  childrenByParent: Map<string, string[]>,
  positions: Record<string, AppPageGraphPosition>,
): number {
  const page = pagesById.get(pageId);
  if (!page) {
    return fallbackX + NODE_WIDTH + SIBLING_GAP;
  }

  if (!positions[pageId]) {
    positions[pageId] = { x: fallbackX, y: fallbackY };
  }

  const pos = positions[pageId]!;
  const children = childrenByParent.get(pageId) ?? [];

  if (children.length === 0) {
    return pos.x + NODE_WIDTH + SIBLING_GAP;
  }

  const childY = pos.y + GAP_Y;
  let nextChildX = pos.x;
  const childCenters: number[] = [];

  for (const childId of children) {
    const existingChildPos = positions[childId];
    if (existingChildPos) {
      assignSubtreePositions(
        childId,
        existingChildPos.x,
        existingChildPos.y,
        pagesById,
        childrenByParent,
        positions,
      );
      const placedChildPos = positions[childId] ?? existingChildPos;
      nextChildX = Math.max(
        nextChildX,
        placedChildPos.x + NODE_WIDTH + SIBLING_GAP,
      );
      childCenters.push(placedChildPos.x + NODE_WIDTH / 2);
      continue;
    }

    assignSubtreePositions(
      childId,
      nextChildX,
      childY,
      pagesById,
      childrenByParent,
      positions,
    );
    const placedChildPos = positions[childId];
    if (!placedChildPos) {
      continue;
    }
    nextChildX = placedChildPos.x + NODE_WIDTH + SIBLING_GAP;
    childCenters.push(placedChildPos.x + NODE_WIDTH / 2);
  }

  if (!page.graphPosition && childCenters.length > 0) {
    const minCenter = childCenters[0]!;
    const maxCenter = childCenters[childCenters.length - 1]!;
    pos.x = Math.max(ORIGIN_X, (minCenter + maxCenter) / 2 - NODE_WIDTH / 2);
    positions[pageId] = pos;
  }

  return Math.max(nextChildX, pos.x + NODE_WIDTH + SIBLING_GAP);
}

export function buildTreeGraphLayout(
  pages: AppPageData[],
): Record<string, AppPageGraphPosition> {
  return buildGraphPositions(pages);
}

export function buildGraphPositions(
  pages: AppPageData[],
  anchorPositions?: ReadonlyMap<string, AppPageGraphPosition>,
): Record<string, AppPageGraphPosition> {
  const positions: Record<string, AppPageGraphPosition> = {};
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const pageIds = new Set(pages.map((page) => page.id));
  const childrenByParent = buildChildrenMap(pages);
  const hasHierarchy = pages.some(
    (page) => page.parentPageId && pageIds.has(page.parentPageId),
  );

  for (const page of pages) {
    const anchor = anchorPositions?.get(page.id) ?? page.graphPosition;
    if (anchor) {
      positions[page.id] = { x: anchor.x, y: anchor.y };
    }
  }

  const hasSeededAnchors = pages.some((page) => positions[page.id]);

  if (!hasHierarchy && !hasSeededAnchors) {
    let autoIndex = 0;
    for (const page of pages) {
      positions[page.id] = resolveAppPageGraphPosition(page, autoIndex);
      autoIndex += 1;
    }
    return positions;
  }

  let autoIndex = 0;
  let changed = true;
  while (changed) {
    changed = false;

    for (const page of pages) {
      if (positions[page.id]) {
        continue;
      }

      if (page.parentPageId && pageIds.has(page.parentPageId)) {
        const parentPos = positions[page.parentPageId];
        if (!parentPos) {
          continue;
        }

        positions[page.id] = resolveChildPagePosition(
          page.id,
          page.parentPageId,
          childrenByParent,
          positions,
        );
        changed = true;
        continue;
      }

      if (!hasHierarchy) {
        positions[page.id] = resolveFlatPagePosition(
          page,
          pages,
          positions,
          autoIndex,
        );
        autoIndex += 1;
        changed = true;
      }
    }
  }

  if (hasHierarchy) {
    const roots = pages
      .filter(
        (page) =>
          (!page.parentPageId || !pageIds.has(page.parentPageId)) &&
          !positions[page.id],
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    let rootX = resolveFlatPagePosition(
      roots[0] ?? pages[0]!,
      pages,
      positions,
      0,
    ).x;

    for (const root of roots) {
      rootX = assignSubtreePositions(
        root.id,
        rootX,
        ORIGIN_Y,
        pagesById,
        childrenByParent,
        positions,
      );
      rootX += SIBLING_GAP;
    }
  }

  for (const page of pages) {
    if (!positions[page.id]) {
      positions[page.id] = resolveFlatPagePosition(
        page,
        pages,
        positions,
        autoIndex,
      );
      autoIndex += 1;
    }
  }

  return positions;
}
