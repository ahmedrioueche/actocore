import type { ReactNode } from 'react';

interface PlanFormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PlanFormSection({
  title,
  subtitle,
  children,
}: PlanFormSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface-secondary/30 p-4 md:p-5">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
