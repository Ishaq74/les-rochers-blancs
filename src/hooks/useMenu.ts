import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantMenu {
  id: string;
  slug: string;
  price: number | null;
  year: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  name: string;
  description: string | null;
}

interface MenuCategory {
  id: string;
  menu_id: string | null;
  slug: string;
  sort_order: number;
  name: string;
  description: string | null;
}

interface MenuItem {
  id: string;
  category_id: string;
  slug: string;
  price: number;
  image_url: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_signature: boolean;
  sort_order: number;
  name: string;
  description: string | null;
}

export const useMenu = (locale: string) => {
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);

        // Fetch restaurant menus with translations
        const { data: menusData, error: menusError } = await supabase
          .from('restaurant_menus')
          .select('id, slug, price, year, start_date, end_date, image_url, is_active, sort_order')
          .eq('is_active', true)
          .order('sort_order');

        if (menusError) throw menusError;

        const { data: menuTransData, error: menuTransError } = await supabase
          .from('restaurant_menu_translations')
          .select('menu_id, name, description')
          .eq('locale', locale);

        if (menuTransError) throw menuTransError;

        const menusWithTrans = (menusData || []).map((menu) => {
          const trans = (menuTransData || []).find((t) => t.menu_id === menu.id);
          return {
            ...menu,
            name: trans?.name || menu.slug,
            description: trans?.description || null,
          };
        });

        setMenus(menusWithTrans);

        // Fetch categories with translations
        const { data: categoriesData, error: catError } = await supabase
          .from('menu_categories')
          .select('id, menu_id, slug, sort_order')
          .eq('is_active', true)
          .order('sort_order');

        if (catError) throw catError;

        const { data: catTransData, error: catTransError } = await supabase
          .from('menu_category_translations')
          .select('category_id, name, description')
          .eq('locale', locale);

        if (catTransError) throw catTransError;

        const categoriesWithTrans = (categoriesData || []).map((cat) => {
          const trans = (catTransData || []).find((t) => t.category_id === cat.id);
          return {
            ...cat,
            name: trans?.name || cat.slug,
            description: trans?.description || null,
          };
        });

        setCategories(categoriesWithTrans);

        // Fetch items with translations
        const { data: itemsData, error: itemError } = await supabase
          .from('menu_items')
          .select('id, category_id, slug, price, image_url, is_vegetarian, is_vegan, is_gluten_free, is_signature, sort_order')
          .eq('is_active', true)
          .order('sort_order');

        if (itemError) throw itemError;

        const { data: itemTransData, error: itemTransError } = await supabase
          .from('menu_item_translations')
          .select('item_id, name, description')
          .eq('locale', locale);

        if (itemTransError) throw itemTransError;

        const itemsWithTrans = (itemsData || []).map((item) => {
          const trans = (itemTransData || []).find((t) => t.item_id === item.id);
          return {
            ...item,
            name: trans?.name || item.slug,
            description: trans?.description || null,
          };
        });

        setItems(itemsWithTrans);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [locale]);

  const getCategoriesByMenu = (menuId: string) => {
    return categories.filter((cat) => cat.menu_id === menuId);
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter((item) => item.category_id === categoryId);
  };

  return {
    menus,
    categories,
    items,
    getCategoriesByMenu,
    getItemsByCategory,
    isLoading,
    error,
  };
};
