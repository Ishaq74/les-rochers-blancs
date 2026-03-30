import fr from '@/i18n/locales/fr.json';
import en from '@/i18n/locales/en.json';
import ar from '@/i18n/locales/ar.json';
import zh from '@/i18n/locales/zh.json';
import { ar as arDateFns, enUS, fr as frDateFns, zhCN } from 'date-fns/locale';

const translations: Record<string, Record<string, unknown>> = { fr, en, ar, zh };

export const LOCALES = ['fr', 'en', 'ar', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: Locale[] = ['ar'];

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

/**
 * Get a nested translation value by dot-notation key.
 * e.g. t('hero.title', 'fr') → the French hero title
 */
export function t(key: string, locale: string): string {
  const normalized = locale.split('-')[0];
  const lang = translations[normalized] ?? translations.fr;
  const parts = key.split('.');
  let current: unknown = lang;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
}

/**
 * Get an entire nested section object.
 * e.g. getSection('hero', 'fr') → { title: '...', subtitle: '...', ... }
 */
export function getSection(section: string, locale: string): Record<string, unknown> {
  const normalized = locale.split('-')[0];
  const lang = translations[normalized] ?? translations.fr;
  const result = (lang as Record<string, unknown>)[section];
  return (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>;
}

export function getDateFnsLocale(locale: string) {
  switch (locale) {
    case 'fr':
      return frDateFns;
    case 'ar':
      return arDateFns;
    case 'zh':
      return zhCN;
    default:
      return enUS;
  }
}

export function getIntlLocale(locale: string) {
  switch (locale) {
    case 'fr':
      return 'fr-FR';
    case 'ar':
      return 'ar';
    case 'zh':
      return 'zh-CN';
    default:
      return 'en-US';
  }
}
