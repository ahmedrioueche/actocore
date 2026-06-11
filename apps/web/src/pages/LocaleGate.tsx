import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { isAppLocale, routing } from '@/i18n/routing';

export function LocaleGate() {
  const { locale } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isAppLocale(locale) && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  if (!isAppLocale(locale)) {
    return <Navigate to={`/${routing.defaultLocale}`} replace />;
  }

  return <Outlet />;
}
