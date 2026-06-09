import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface MobileDataCardProps {
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function MobileDataCard({
  children,
  actions,
  footer,
  className,
}: MobileDataCardProps) {
  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </div>
      {footer ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">{footer}</div>
      ) : null}
    </div>
  );
}

interface MobileDataRowProps {
  label: string;
  value: ReactNode;
}

export function MobileDataRow({ label, value }: MobileDataRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span className="min-w-0 text-end text-text-primary">{value}</span>
    </div>
  );
}
