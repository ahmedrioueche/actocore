import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

interface ActivityMeterProps {
  label: string;
  value: number;
  max: number;
  formatValue?: (value: number) => string;
  isLoading?: boolean;
  toneClassName?: string;
}

export function ActivityMeter({
  label,
  value,
  max,
  formatValue = (v) => String(v),
  isLoading = false,
  toneClassName = 'bg-brand-gradient',
}: ActivityMeterProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="font-semibold text-text-primary">{formatValue(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-500', toneClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
