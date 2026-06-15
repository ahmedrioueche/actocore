import type { ReactNode } from 'react';

import { LocaleLink } from '@/i18n/LocaleLink';
import { cn } from '@/lib/utils';

type CtaButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
  external?: boolean;
};

function isExternalHref(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:')
  );
}

export function CtaButton({
  href,
  children,
  variant = 'primary',
  className,
  external = false,
}: CtaButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background';
  const styles =
    variant === 'primary'
      ? 'bg-brand-gradient text-primary-contrast shadow-md hover:brightness-110'
      : 'border border-border bg-surface text-text-primary hover:bg-surface-hover';
  const classNames = cn(base, styles, className);

  if (external || isExternalHref(href)) {
    return (
      <a
        href={href}
        className={classNames}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : undefined)}
      >
        {children}
      </a>
    );
  }

  return (
    <LocaleLink href={href} className={classNames}>
      {children}
    </LocaleLink>
  );
}
