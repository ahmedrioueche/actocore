import { Link, useParams, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  PROJECT_DOCS_NAV,
  projectDocsPath,
} from '@/constants/project-docs-nav';
import { cn } from '@/utils/helper';

const ITEM_BASE =
  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors md:w-full';

export function ProjectDocsSidebar() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (!projectId) {
    return null;
  }

  const docsBase = `/projects/${projectId}/docs`;

  const isActive = (segment: string) => {
    if (!segment) {
      return pathname === docsBase || pathname === `${docsBase}/`;
    }
    return pathname === `${docsBase}/${segment}`;
  };

  return (
    <aside className="w-full shrink-0 md:w-56">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {t('projectDocs.sidebarTitle')}
      </p>
      <nav className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar md:block md:space-y-1 md:overflow-visible md:pb-0">
        {PROJECT_DOCS_NAV.map((item) => {
          const active = isActive(item.segment);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={projectDocsPath(item.segment)}
              params={{ projectId }}
              className={cn(
                ITEM_BASE,
                active
                  ? 'bg-surface-hover text-text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
