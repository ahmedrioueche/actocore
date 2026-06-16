import type { ComponentProps, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { isAppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: ComponentProps<typeof Link>["onClick"];
  style?: ComponentProps<typeof Link>['style'];
};

function resolveLocalePath(href: string, locale: string): string | { pathname: string; hash: string } {
  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return href;
  }

  if (href.startsWith('/#')) {
    return {
      pathname: `/${locale}`,
      hash: href.slice(1),
    };
  }

  const path = href.startsWith('/') ? href : `/${href}`;
  return `/${locale}${path === '/' ? '' : path}`;
}

export function LocaleLink({
  href,
  children,
  className,
  onClick,
  style,
  ...rest
}: LocaleLinkProps) {
  const { locale } = useParams();
  const activeLocale = isAppLocale(locale) ? locale : 'en';
  const target = resolveLocalePath(href, activeLocale);

  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={cn(className)} onClick={onClick} style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link
      to={target}
      className={cn(className)}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {children}
    </Link>
  );
}
