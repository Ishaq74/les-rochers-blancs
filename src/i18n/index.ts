import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ar: { translation: ar },
  zh: { translation: zh },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['fr', 'en', 'ar', 'zh'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    cleanCode: true,
    lowerCaseLng: true,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
