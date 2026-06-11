import { Globe, Mail, Terminal } from 'lucide-react';
import { useT } from '@/i18n/useT';

import { LocaleLink } from '@/i18n/LocaleLink';

const FOOTER_SECTIONS = [
  {
    titleKey: 'product' as const,
    links: [
      { href: '/docs', labelKey: 'sdkReference' as const },
      { href: '/pricing', labelKey: 'pricing' as const },
      { href: '/docs', labelKey: 'changelog' as const },
      { href: '/docs', labelKey: 'integrations' as const },
    ],
  },
  {
    titleKey: 'resources' as const,
    links: [
      { href: '/docs', labelKey: 'documentation' as const },
      { href: '/docs', labelKey: 'apiStatus' as const },
      { href: '/docs', labelKey: 'community' as const },
      { href: '/docs', labelKey: 'caseStudies' as const },
    ],
  },
  {
    titleKey: 'company' as const,
    links: [
      { href: '/docs', labelKey: 'about' as const },
      { href: '/docs', labelKey: 'careers' as const },
      { href: '/docs', labelKey: 'blog' as const },
      { href: 'mailto:contact@actocore.pro', labelKey: 'contact' as const, external: true },
    ],
  },
  {
    titleKey: 'legal' as const,
    links: [
      { href: '/privacy', labelKey: 'privacy' as const },
      { href: '/terms', labelKey: 'terms' as const },
      { href: '/privacy', labelKey: 'security' as const },
      { href: '/privacy', labelKey: 'compliance' as const },
    ],
  },
] as const;

export function SiteFooter() {
  const { t } = useT('footer');
  const { t: tSite } = useT('site');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-surface-secondary pt-16">
      <div className="site-container">
        <div className="mb-16 grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">
            <div className="mb-8 flex items-center gap-2">
              <img src="/actocore_icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="text-xl font-bold text-text-primary">{tSite('name')}</span>
            </div>
            <p className="mb-8 max-w-xs text-sm text-text-secondary">{t('tagline')}</p>
            <div className="flex gap-4">
              <a
                href="https://actocore.pro"
                className="text-muted transition-colors hover:text-primary"
                aria-label="Website"
              >
                <Globe className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="/docs"
                className="text-muted transition-colors hover:text-primary"
                aria-label="Documentation"
              >
                <Terminal className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="mailto:contact@actocore.pro"
                className="text-muted transition-colors hover:text-primary"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" aria-hidden />
              </a>
            </div>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.titleKey} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-text-primary">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                {section.links.map((link) => {
                  const label =
                    link.labelKey === 'privacy' || link.labelKey === 'terms'
                      ? t(link.labelKey)
                      : t(`links.${link.labelKey}`);

                  return (
                    <li key={link.labelKey}>
                      {'external' in link && link.external ? (
                        <a href={link.href} className="hover:text-primary">
                          {label}
                        </a>
                      ) : (
                        <LocaleLink href={link.href} className="hover:text-primary">
                          {label}
                        </LocaleLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 py-8 md:flex-row">
          <p className="text-sm text-muted">{t('copyright', { year })}</p>
          <div className="flex items-center gap-8 text-sm text-muted">
            <span>{t('builtIn')}</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              {t('status')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
