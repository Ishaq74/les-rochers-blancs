import { db } from '@/db';
import { themeSettings, siteSettings, cmsContent, pageSections } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { t, type Locale } from '@/lib/i18n';

// =====================================================
// THEME SETTINGS — CSS custom properties from DB
// =====================================================

export interface ThemeSetting {
  settingKey: string;
  settingValue: string;
  settingType: string;
  category: string;
}

let themeCache: { data: ThemeSetting[]; ts: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute

export async function getThemeSettings(): Promise<ThemeSetting[]> {
  if (themeCache && Date.now() - themeCache.ts < CACHE_TTL) return themeCache.data;
  try {
    const rows = await db.select().from(themeSettings);
    themeCache = { data: rows, ts: Date.now() };
    return rows;
  } catch {
    return [];
  }
}

/**
 * Generate inline CSS custom properties from theme_settings.
 * Keys like "primary-color" become "--primary-color: #value".
 */
export async function getThemeCssOverrides(): Promise<string> {
  const settings = await getThemeSettings();
  if (!settings.length) return '';
  const vars = settings
    .map((s) => `--${s.settingKey}: ${s.settingValue};`)
    .join('\n  ');
  return `:root {\n  ${vars}\n}`;
}

// =====================================================
// SITE SETTINGS — Contact info, social, general config
// =====================================================

export interface SiteSetting {
  settingKey: string;
  settingValue: string;
  settingType: string;
  category: string;
}

let siteCache: { data: Map<string, string>; ts: number } | null = null;

export async function getSiteSettings(): Promise<Map<string, string>> {
  if (siteCache && Date.now() - siteCache.ts < CACHE_TTL) return siteCache.data;
  try {
    const rows = await db.select().from(siteSettings);
    const map = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
    siteCache = { data: map, ts: Date.now() };
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Get a site setting with i18n fallback.
 * siteKey: the DB key (e.g. "contact_phone")
 * i18nKey: the translation key fallback (e.g. "contact.phoneValue")
 */
export async function getSetting(siteKey: string, i18nKey: string, locale: Locale): Promise<string> {
  const settings = await getSiteSettings();
  const val = settings.get(siteKey);
  if (val && val.trim()) return val;
  return t(i18nKey, locale);
}

// =====================================================
// CMS CONTENT — Section-based content from DB with i18n fallback
// =====================================================

let cmsCache: { data: Map<string, string>; ts: number } | null = null;

export async function getCmsContent(): Promise<Map<string, string>> {
  if (cmsCache && Date.now() - cmsCache.ts < CACHE_TTL) return cmsCache.data;
  try {
    const rows = await db.select().from(cmsContent);
    const map = new Map(rows.map((r) => [`${r.sectionKey}.${r.locale}.${r.fieldKey}`, r.content]));
    cmsCache = { data: map, ts: Date.now() };
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Get CMS content with i18n fallback.
 * sectionKey: DB section (e.g. "hero")
 * fieldKey: DB field (e.g. "title")
 * i18nKey: translation key fallback (e.g. "hero.title")
 */
export async function cms(sectionKey: string, fieldKey: string, locale: Locale, i18nKey?: string): Promise<string> {
  const content = await getCmsContent();
  const val = content.get(`${sectionKey}.${locale}.${fieldKey}`);
  if (val && val.trim()) return val;
  // Fallback to i18n
  const fallbackKey = i18nKey ?? `${sectionKey}.${fieldKey}`;
  return t(fallbackKey, locale);
}

// =====================================================
// PAGE SECTIONS — Ordering & visibility
// =====================================================

const DEFAULT_SECTION_ORDER = [
  'hero', 'openings', 'rooms', 'restaurant', 'menu', 'partners', 'access', 'contact',
];

export interface SectionLayout {
  sectionKey: string;
  isVisible: boolean;
}

let sectionCache: { data: Map<string, SectionLayout[]>; ts: number } | null = null;

export async function getPageSections(pageSlug = 'accueil'): Promise<SectionLayout[]> {
  if (!sectionCache || Date.now() - sectionCache.ts >= CACHE_TTL) {
    sectionCache = { data: new Map(), ts: Date.now() };
  }
  const cached = sectionCache.data.get(pageSlug);
  if (cached) return cached;
  try {
    const rows = await db.select().from(pageSections)
      .where(eq(pageSections.pageSlug, pageSlug))
      .orderBy(asc(pageSections.sortOrder));
    if (rows.length > 0) {
      const result = rows.map(r => ({ sectionKey: r.sectionKey, isVisible: r.isVisible }));
      sectionCache.data.set(pageSlug, result);
      return result;
    }
  } catch {
    // fall through to default
  }
  const fallback = DEFAULT_SECTION_ORDER.map(key => ({ sectionKey: key, isVisible: true }));
  sectionCache.data.set(pageSlug, fallback);
  return fallback;
}
