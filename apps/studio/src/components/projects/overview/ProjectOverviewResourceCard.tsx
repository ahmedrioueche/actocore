import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';

interface ProjectOverviewResourceCardProps {
  to: string;
  params: { projectId: string };
  icon: LucideIcon;
  label: string;
  count: number;
  isLoading?: boolean;
}

export function ProjectOverviewResourceCard({
  to,
  params,
  icon: Icon,
  label,
  count,
  isLoading = false,
}: ProjectOverviewResourceCardProps) {
  return (
    <Link
      to={to}
      params={params}
      preload="intent"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-7 w-12" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-text-primary">
            {count}
          </p>
        )}
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
