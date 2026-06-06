import { Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

type TipVariant = 'info' | 'success' | 'warning';

const VARIANT_STYLES: Record<TipVariant, string> = {
  info: 'border-border bg-surface-secondary',
  success: 'border-success/25 bg-success-surface/80',
  warning: 'border-warning/25 bg-warning-surface/80',
};

const VARIANT_ICON_STYLES: Record<TipVariant, string> = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
};

interface TipProps {
  title?: string;
  children: ReactNode;
  variant?: TipVariant;
  icon?: LucideIcon;
  className?: string;
}

export default function Tip({
  title,
  children,
  variant = 'info',
  icon: Icon = Info,
  className,
}: TipProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm',
        VARIANT_STYLES[variant],
        className,
      )}
      role="note"
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 shrink-0', VARIANT_ICON_STYLES[variant])}
        aria-hidden
      />
      <div className="min-w-0 space-y-2 text-text-secondary">
        {title ? (
          <p className="font-medium text-text-primary">{title}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
