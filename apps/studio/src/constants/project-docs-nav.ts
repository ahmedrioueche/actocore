import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  Map,
  Package,
  Rocket,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

export type ProjectDocsSectionId =
  | 'overview'
  | 'quick-start'
  | 'api-keys'
  | 'knowledge'
  | 'actions'
  | 'app-layout'
  | 'sdk-config'
  | 'sdk-updates';

export interface ProjectDocsNavItem {
  id: ProjectDocsSectionId;
  labelKey: string;
  icon: LucideIcon;
  /** Route path after `/projects/$projectId/docs` — empty string for index. */
  segment: string;
}

export const PROJECT_DOCS_NAV: ProjectDocsNavItem[] = [
  {
    id: 'overview',
    labelKey: 'projectDocs.nav.overview',
    icon: LayoutDashboard,
    segment: '',
  },
  {
    id: 'quick-start',
    labelKey: 'projectDocs.nav.quickStart',
    icon: Rocket,
    segment: 'quick-start',
  },
  {
    id: 'api-keys',
    labelKey: 'projectDocs.nav.apiKeys',
    icon: KeyRound,
    segment: 'api-keys',
  },
  {
    id: 'knowledge',
    labelKey: 'projectDocs.nav.knowledge',
    icon: BookOpen,
    segment: 'knowledge',
  },
  {
    id: 'actions',
    labelKey: 'projectDocs.nav.actions',
    icon: Zap,
    segment: 'actions',
  },
  {
    id: 'app-layout',
    labelKey: 'projectDocs.nav.appLayout',
    icon: Map,
    segment: 'app-layout',
  },
  {
    id: 'sdk-config',
    labelKey: 'projectDocs.nav.sdkConfig',
    icon: SlidersHorizontal,
    segment: 'sdk-config',
  },
  {
    id: 'sdk-updates',
    labelKey: 'projectDocs.nav.sdkUpdates',
    icon: Package,
    segment: 'sdk-updates',
  },
];

export function projectDocsPath(segment: string): string {
  return segment ? `/projects/$projectId/docs/${segment}` : '/projects/$projectId/docs';
}
