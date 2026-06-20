import type { AppPageData, AppPageGraphPosition } from '@ahmedrioueche/actocore-shared';

const GRID_COLUMNS = 3;
const GAP_X = 320;
const GAP_Y = 240;
const ORIGIN_X = 80;
const ORIGIN_Y = 80;

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

export function buildGraphPositions(
  pages: AppPageData[],
): Record<string, AppPageGraphPosition> {
  let autoIndex = 0;
  const positions: Record<string, AppPageGraphPosition> = {};

  for (const page of pages) {
    if (page.graphPosition) {
      positions[page.id] = page.graphPosition;
    } else {
      positions[page.id] = resolveAppPageGraphPosition(page, autoIndex);
      autoIndex += 1;
    }
  }

  return positions;
}
