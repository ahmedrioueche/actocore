import type { ReactNode } from 'react';

interface OnboardingStepPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function OnboardingStepPanel({
  title,
  subtitle,
  children,
}: OnboardingStepPanelProps) {
  return (
    <section>
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[1.375rem] sm:leading-snug">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
