import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

export function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit?: number | null;
}) {
  const { t } = useTranslation();
  const hasLimit = limit != null && limit > 0;
  const percent = hasLimit ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-text-secondary">
          {hasLimit
            ? t('billing.usageValue', { used, limit })
            : t('billing.usageUnlimited', { used })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className={cn(
            'h-full rounded-full bg-brand-gradient transition-all duration-500',
            percent >= 90 && 'from-danger to-danger-hover',
          )}
          style={{ width: hasLimit ? `${percent}%` : '0%' }}
        />
      </div>
    </div>
  );
}

export function UsageMeterSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
