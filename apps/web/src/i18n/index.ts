import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import { routing } from './routing';

void i18n.use(initReactI18next).init({
  lng: routing.defaultLocale,
  fallbackLng: routing.defaultLocale,
  supportedLngs: [...routing.locales],
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
