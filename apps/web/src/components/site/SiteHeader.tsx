import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/i18n/useT';

import { LocaleLink } from '@/i18n/LocaleLink';
import { studioAuthPath } from '@/lib/site';
import { cn } from '@/lib/utils';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { CtaButton } from './CtaButton';

const NAV_LINKS = [
  { href: '/#features', key: 'platform' as const },
  { href: '/#architecture', key: 'architecture' as const },
  { href: '/pricing', key: 'pricing' as const },
  { href: '/docs', key: 'docs' as const },
] as const;

export function SiteHeader() {
  const { t } = useT('nav');
  const { t: tSite } = useT('site');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-md">
      <div className="site-container flex h-20 items-center justify-between gap-4">
        <LocaleLink href="/" className="flex items-center gap-2.5 font-semibold text-text-primary">
          <img src="/actocore_icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span>{tSite('name')}</span>
        </LocaleLink>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(item.key)}
            </LocaleLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <a
            href={studioAuthPath('login')}
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {t('signIn')}
          </a>
          <CtaButton href={studioAuthPath('signup')}>{t('getStarted')}</CtaButton>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={t('menu')}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'border-t border-border bg-surface md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="site-container flex flex-col gap-4 py-4">
          {NAV_LINKS.map((item) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-primary"
              onClick={() => setOpen(false)}
            >
              {t(item.key)}
            </LocaleLink>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <a href={studioAuthPath('login')} className="text-sm font-medium text-text-secondary">
            {t('signIn')}
          </a>
          <CtaButton href={studioAuthPath('signup')} className="w-full text-center">
            {t('getStarted')}
          </CtaButton>
        </div>
      </div>
    </header>
  );
}
