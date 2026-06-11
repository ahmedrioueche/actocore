import type { ComponentProps, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { isAppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

function resolveLocalePath(href: string, locale: string): string {
  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return href;
  }

  if (href.startsWith('/#')) {
    return `/${locale}${href}`;
  }

  const path = href.startsWith('/') ? href : `/${href}`;
  return `/${locale}${path === '/' ? '' : path}`;
}

export function LocaleLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: LocaleLinkProps) {
  const { locale } = useParams();
  const activeLocale = isAppLocale(locale) ? locale : 'en';
  const target = resolveLocalePath(href, activeLocale);

  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={cn(className)} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={target} className={cn(className)} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
