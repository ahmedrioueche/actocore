import { useT } from '@/i18n/useT';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import i18n from '@/i18n';
import { isAppLocale, routing, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LABELS: Record<AppLocale, string> = {
  en: 'English',
  fr: 'Français',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useT('nav');
  const { locale } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  return (
    <label className={cn('inline-flex items-center gap-2', className)}>
      <span className="sr-only">{t('language')}</span>
      <select
        value={activeLocale}
        onChange={(event) => {
          const next = event.target.value as AppLocale;
          if (!routing.locales.includes(next)) {
            return;
          }
          void i18n.changeLanguage(next);
          const pathWithoutLocale = location.pathname.replace(
            new RegExp(`^/${activeLocale}`),
            '',
          );
          navigate(`/${next}${pathWithoutLocale || ''}${location.hash}`);
        }}
        className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
