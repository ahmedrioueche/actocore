import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import i18n from '@/i18n';
import { isAppLocale, routing } from '@/i18n/routing';

export function LocaleGate() {
  const { locale } = useParams();

  useEffect(() => {
    if (isAppLocale(locale) && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (!isAppLocale(locale)) {
    return <Navigate to={`/${routing.defaultLocale}`} replace />;
  }

  return <Outlet />;
}
