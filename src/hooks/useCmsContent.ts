import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n';

interface CmsContent {
  section_key: string;
  locale: string;
  field_key: string;
  content: string;
}

/**
 * Fetches all CMS content from the database and merges it into i18n resources.
 * This allows admins to override any translation key via the CMS admin panel.
 * 
 * Convention: cms_content rows with section_key="hero", field_key="title", locale="fr"
 * will override the i18n key "hero.title" for locale "fr".
 * 
 * Supports nested keys using dot notation in field_key, e.g. "rooms.single.name"
 */
export const useCmsContent = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadCmsContent = async () => {
      try {
        const { data, error } = await supabase
          .from('cms_content')
          .select('section_key, locale, field_key, content');

        if (error) {
          console.error('Error loading CMS content:', error);
          setIsLoaded(true);
          return;
        }

        if (data && data.length > 0) {
          // Group by locale
          const byLocale: Record<string, Record<string, string>> = {};
          
          (data as CmsContent[]).forEach((item) => {
            if (!byLocale[item.locale]) {
              byLocale[item.locale] = {};
            }
            // Build the full translation key: section_key.field_key
            const fullKey = `${item.section_key}.${item.field_key}`;
            byLocale[item.locale][fullKey] = item.content;
          });

          // Merge into i18n for each locale
          Object.entries(byLocale).forEach(([locale, overrides]) => {
            // Convert flat keys to nested object
            const nested = flatToNested(overrides);
            // addResourceBundle with deep=true and overwrite=true merges and overwrites
            i18n.addResourceBundle(locale, 'translation', nested, true, true);
          });
        }
      } catch (err) {
        console.error('Failed to load CMS content:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCmsContent();
  }, []);

  return { isLoaded };
};

/**
 * Convert flat dot-notation keys to nested object.
 * e.g. { "hero.title": "Foo", "hotel.rooms.single.name": "Bar" }
 * becomes { hero: { title: "Foo" }, hotel: { rooms: { single: { name: "Bar" } } } }
 */
function flatToNested(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.entries(flat).forEach(([key, value]) => {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  });
  
  return result;
}
