import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface AnalyticsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AnalyticsPanel({
  title,
  description,
  children,
  className,
}: AnalyticsPanelProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface p-6 shadow-sm',
        className,
      )}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
