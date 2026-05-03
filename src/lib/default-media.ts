export const DEFAULT_HOTEL_GALLERY = [
  '/images/fallback/room-suite.jpg',
  '/images/fallback/season-summer.jpg',
  '/images/fallback/season-winter.jpg',
] as const;

export const DEFAULT_RESTAURANT_GALLERY = [
  '/images/fallback/restaurant.jpg',
  '/images/fallback/season-summer.jpg',
  '/images/fallback/hero-mountain.jpg',
] as const;

export const DEFAULT_PARTNER_LOGOS: Record<string, string> = {
  'alpes-bivouac': '/images/partners/alpes-bivouac.webp',
  'amt-organisation': '/images/partners/amt-organisation.webp',
  'annecy-aventure': '/images/partners/annecy-aventure.webp',
  'annecy-takamaka': '/images/partners/annecy-takamaka.webp',
  'que-faire-a-annecy': '/images/partners/que-faire-a-annecy.webp',
  semnoz: '/images/partners/semnoz.webp',
};

export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
