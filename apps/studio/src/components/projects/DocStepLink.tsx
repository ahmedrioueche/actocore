import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface DocStepLinkProps {
  to: string;
  params: { projectId: string };
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
}

export function DocStepLink({
  to,
  params,
  icon: Icon,
  title,
  description,
  step,
}: DocStepLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      preload="intent"
      className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-primary-contrast shadow-sm">
        {step}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
