import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  accountLocaleToStudioLanguage,
  applyStudioLanguage,
} from '@/constants/languages';
import { useAuth } from '@/context/AuthContext';

/** Applies workspace defaultLocale to the Studio UI language after sign-in. */
export function StudioLanguageSync() {
  const { session, isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || !session?.account) {
      return;
    }

    const lang = accountLocaleToStudioLanguage(session.account.defaultLocale);
    applyStudioLanguage(lang);
    if (i18n.resolvedLanguage !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [isAuthenticated, session?.account?.defaultLocale, i18n]);

  return null;
}
