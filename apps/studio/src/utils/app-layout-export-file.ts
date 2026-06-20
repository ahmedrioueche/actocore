import type { AppLayoutExportV1 } from '@ahmedrioueche/actocore-shared';

export function downloadAppLayoutJson(
  layout: AppLayoutExportV1,
  filename = 'app-layout.json',
): void {
  const blob = new Blob([JSON.stringify(layout, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildAppLayoutExportFilename(projectName?: string): string {
  const base = projectName
    ? projectName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : 'app-layout';
  return `${base || 'app-layout'}.json`;
}
