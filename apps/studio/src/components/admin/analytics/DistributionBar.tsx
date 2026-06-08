import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

export interface DistributionSegment {
  key: string;
  label: string;
  value: number;
  colorClass: string;
}

interface DistributionBarProps {
  segments: DistributionSegment[];
  total?: number;
  isLoading?: boolean;
  className?: string;
}

export function DistributionBar({
  segments,
  total,
  isLoading = false,
  className,
}: DistributionBarProps) {
  const computedTotal =
    total ?? segments.reduce((sum, segment) => sum + segment.value, 0);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-secondary">
        {segments.map((segment) => {
          const width =
            computedTotal > 0 ? (segment.value / computedTotal) * 100 : 0;
          if (width <= 0) {
            return null;
          }
          return (
            <div
              key={segment.key}
              className={cn('h-full transition-all duration-500', segment.colorClass)}
              style={{ width: `${width}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {segments.map((segment) => {
          const percent =
            computedTotal > 0
              ? Math.round((segment.value / computedTotal) * 100)
              : 0;
          return (
            <div
              key={segment.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', segment.colorClass)}
                  aria-hidden
                />
                <span className="truncate text-text-secondary">{segment.label}</span>
              </div>
              <span className="shrink-0 font-semibold text-text-primary">
                {segment.value}
                <span className="ms-1 font-normal text-text-secondary">
                  ({percent}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
