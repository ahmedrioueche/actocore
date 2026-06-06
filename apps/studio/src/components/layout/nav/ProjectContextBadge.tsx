import { Link } from '@tanstack/react-router';
import { FolderKanban, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useProject } from '@/hooks/use-projects';
import { cn } from '@/utils/helper';

interface ProjectContextBadgeProps {
  projectId: string;
}

export function ProjectContextBadge({ projectId }: ProjectContextBadgeProps) {
  const { t } = useTranslation();
  const projectQuery = useProject(projectId);
  const projectName = projectQuery.data?.name ?? t('nav.project.loadingName');

  return (
    <div className="flex min-w-0 max-w-full items-center gap-1.5 sm:gap-2">
      <div
        className={cn(
          'flex min-w-0 max-w-[11rem] items-center gap-2 rounded-xl border border-border',
          'bg-surface-secondary/80 px-2 py-1.5 sm:max-w-xs sm:gap-3 sm:px-3 sm:py-2',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-primary-contrast sm:h-9 sm:w-9">
          <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            {t('nav.project.label')}
          </p>
          <p className="truncate text-sm font-semibold text-text-primary">
            {projectName}
          </p>
        </div>
      </div>

      <Link
        to="/projects"
        preload="intent"
        aria-label={t('nav.allProjects')}
        className={cn(
          'flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border',
          'bg-surface-secondary/80 text-text-secondary transition-colors',
          'hover:bg-surface-hover hover:text-text-primary',
          'h-8 min-w-8 px-2 sm:h-auto sm:min-w-0 sm:px-3 sm:py-2',
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
        <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline sm:text-sm">
          {t('nav.allProjects')}
        </span>
      </Link>
    </div>
  );
}
