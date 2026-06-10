import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  applyStudioLanguage,
  resolveStoredStudioLanguage,
} from '@/constants/languages';

import en from './locales/en.json';
import fr from './locales/fr.json';

const initialLanguage = resolveStoredStudioLanguage();
applyStudioLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr'],
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
