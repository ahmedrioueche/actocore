import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

export type PageSkeletonVariant =
  | 'default'
  | 'cards'
  | 'form'
  | 'table'
  | 'panels';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  className?: string;
  showHeader?: boolean;
  cardCount?: number;
  tableRows?: number;
}

function PageSkeletonHeader() {
  return (
    <header className="mb-6 space-y-3 md:mb-8">
      <Skeleton className="h-8 w-44 md:h-9 md:w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
    </header>
  );
}

function PageSkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function PageSkeletonForm() {
  return (
    <div className="space-y-5 rounded-2xl bg-surface p-6 shadow-sm md:p-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}

function PageSkeletonTable({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="hidden border-b border-border px-4 py-3 sm:flex sm:gap-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSkeletonPanels() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="rounded-2xl bg-surface p-6 shadow-sm md:p-8">
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageSkeletonDefault() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = 'default',
  className,
  showHeader = true,
  cardCount = 6,
  tableRows = 5,
}: PageSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn('w-full', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('general.loading')}
    >
      <span className="sr-only">{t('general.loading')}</span>
      {showHeader ? <PageSkeletonHeader /> : null}
      {variant === 'cards' ? <PageSkeletonCards count={cardCount} /> : null}
      {variant === 'form' ? <PageSkeletonForm /> : null}
      {variant === 'table' ? <PageSkeletonTable rows={tableRows} /> : null}
      {variant === 'panels' ? <PageSkeletonPanels /> : null}
      {variant === 'default' ? <PageSkeletonDefault /> : null}
    </div>
  );
}
