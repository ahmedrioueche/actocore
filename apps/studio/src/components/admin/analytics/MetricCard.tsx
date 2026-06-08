import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helper';

export type MetricTone = 'primary' | 'success' | 'warning' | 'info' | 'accent' | 'neutral';

const toneStyles: Record<
  MetricTone,
  { icon: string; ring: string; value: string }
> = {
  primary: {
    icon: 'bg-brand-gradient-soft text-primary',
    ring: 'from-primary/20 via-primary/5 to-transparent',
    value: 'text-text-primary',
  },
  success: {
    icon: 'bg-success/15 text-success',
    ring: 'from-success/20 via-success/5 to-transparent',
    value: 'text-text-primary',
  },
  warning: {
    icon: 'bg-warning/15 text-warning',
    ring: 'from-warning/20 via-warning/5 to-transparent',
    value: 'text-text-primary',
  },
  info: {
    icon: 'bg-secondary/15 text-secondary',
    ring: 'from-secondary/20 via-secondary/5 to-transparent',
    value: 'text-text-primary',
  },
  accent: {
    icon: 'bg-brand-gradient text-primary-contrast shadow-sm',
    ring: 'from-secondary/25 via-primary/10 to-transparent',
    value: 'text-text-primary',
  },
  neutral: {
    icon: 'bg-surface-secondary text-text-secondary',
    ring: 'from-border via-transparent to-transparent',
    value: 'text-text-primary',
  },
};

export interface MetricCardProps {
  label: string;
  value?: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
  isLoading?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  isLoading = false,
  className,
}: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b',
          styles.ring,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-3 h-9 w-28" />
          ) : (
            <p className={cn('mt-2 text-3xl font-bold tracking-tight', styles.value)}>
              {value ?? '—'}
            </p>
          )}
          {hint ? (
            <p className="mt-2 text-sm text-text-secondary">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
