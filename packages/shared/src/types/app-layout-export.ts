import type { AppPageGraphPosition, AppPageKind } from './app-page';

export const APP_LAYOUT_EXPORT_FORMAT_VERSION = '1.0';

export interface AppLayoutExportFunctionality {
  id: string;
  title: string;
  description?: string;
  linkedActionName?: string;
}

export interface AppLayoutExportPage {
  slug: string;
  title: string;
  route: string;
  pageKind?: AppPageKind;
  description?: string;
  enabled?: boolean;
  order?: number;
  parentPageSlug?: string | null;
  graphPosition?: AppPageGraphPosition;
  functionalities?: AppLayoutExportFunctionality[];
}

export interface AppLayoutExportLink {
  sourceSlug: string;
  targetSlug: string;
  label?: string;
}

export interface AppLayoutExportV1 {
  formatVersion: typeof APP_LAYOUT_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  pages: AppLayoutExportPage[];
  links: AppLayoutExportLink[];
  actionAssignments?: Record<string, string[]>;
}

export type AppLayoutImportMode = 'merge' | 'replace';

export interface AppLayoutImportResult {
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
}
