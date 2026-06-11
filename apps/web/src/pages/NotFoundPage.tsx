import { useT } from '@/i18n/useT';

import { LocaleLink } from '@/i18n/LocaleLink';

export function NotFoundPage() {
  const { t } = useT('site');

  return (
    <div className="site-container py-24 text-center">
      <h1 className="text-3xl font-bold text-text-primary">404</h1>
      <p className="mt-4 text-text-secondary">{t('tagline')}</p>
      <LocaleLink
        href="/"
        className="mt-8 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        {t('name')}
      </LocaleLink>
    </div>
  );
}
