import { ar, enUS, fr, zhCN } from 'date-fns/locale';

export const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'zh'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: '🇫🇷 Français',
  en: '🇬🇧 English',
  ar: '🇸🇦 العربية',
  zh: '🇨🇳 中文',
};

export const getBaseLanguage = (language?: string): SupportedLocale => {
  const normalized = (language || 'fr').toLowerCase().split('-')[0];
  if (SUPPORTED_LOCALES.includes(normalized as SupportedLocale)) {
    return normalized as SupportedLocale;
  }
  return 'fr';
};

export const getDateFnsLocale = (language?: string) => {
  switch (getBaseLanguage(language)) {
    case 'fr':
      return fr;
    case 'ar':
      return ar;
    case 'zh':
      return zhCN;
    default:
      return enUS;
  }
};

export const getIntlLocale = (language?: string) => {
  switch (getBaseLanguage(language)) {
    case 'fr':
      return 'fr-FR';
    case 'ar':
      return 'ar';
    case 'zh':
      return 'zh-CN';
    default:
      return 'en-US';
  }
};
