import { useT } from '@/i18n/useT';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import CustomSelect from '@/components/ui/CustomSelect';
import i18n from '@/i18n';
import { isAppLocale, routing, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LABELS: Record<AppLocale, string> = {
  en: 'English',
  fr: 'Français',
};

const FLAGS: Record<AppLocale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useT('nav');
  const { locale } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  const options = routing.locales.map((code) => ({
    value: code,
    label: LABELS[code],
    flag: FLAGS[code],
  }));

  return (
    <div className={cn(className)}>
      <span className="sr-only">{t('language')}</span>
      <CustomSelect
        options={options}
        selectedOption={activeLocale}
        onChange={(next) => {
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
        size="compact"
        triggerClassName="min-w-[7.5rem]"
        ariaLabel={t('language')}
      />
    </div>
  );
}
