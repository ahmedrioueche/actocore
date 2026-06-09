import type { UsageDailyBucket } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { formatCompactNumber } from '@/components/admin/analytics/format-analytics';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

interface UsageTimeSeriesChartProps {
  buckets: UsageDailyBucket[];
  isLoading?: boolean;
  className?: string;
  emptyLabel?: string;
}

export function UsageTimeSeriesChart({
  buckets,
  isLoading = false,
  className,
  emptyLabel,
}: UsageTimeSeriesChartProps) {
  const { t, i18n } = useTranslation();
  const maxRequests = buckets.reduce(
    (max, bucket) => Math.max(max, bucket.requests),
    0,
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        {emptyLabel ?? t('admin.usage.series.empty')}
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {buckets.map((bucket) => {
        const percent =
          maxRequests > 0
            ? Math.min(100, (bucket.requests / maxRequests) * 100)
            : 0;
        return (
          <div key={bucket.date} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-text-primary">{bucket.date}</span>
              <span className="font-semibold text-text-primary">
                {formatCompactNumber(bucket.requests, i18n.language)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
