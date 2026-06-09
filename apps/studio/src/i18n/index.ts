import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveStoredStudioLanguage } from '@/constants/languages';

import en from './locales/en.json';
import fr from './locales/fr.json';

void i18n.use(initReactI18next).init({
  lng: resolveStoredStudioLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
