import type { ProjectData } from '@ahmedrioueche/actocore-shared';
import { Link } from '@tanstack/react-router';
import { FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

interface ProjectCardProps {
  project: ProjectData;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const { t, i18n } = useTranslation();

  const createdLabel = t('projects.created', {
    date: new Date(project.createdAt).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  });

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      preload="intent"
      className={cn(
        'group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] via-surface to-secondary/[0.05] p-5 shadow-sm transition-all duration-300 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
          <FolderKanban className="h-5 w-5 text-primary-contrast" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">{createdLabel}</p>
        </div>
      </div>
    </Link>
  );
}
