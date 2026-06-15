import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeroProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHero({ title, subtitle, eyebrow, children, className }: PageHeroProps) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-4 text-lg text-text-secondary">{subtitle}</p> : null}
      {children}
    </div>
  );
}
