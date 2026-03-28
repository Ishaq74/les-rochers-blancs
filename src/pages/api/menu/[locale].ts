import type { APIRoute } from 'astro';
import { db } from '@/db';
import { restaurantMenus, restaurantMenuTranslations, menuCategories, menuCategoryTranslations, menuItems, menuItemTranslations } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }): Promise<Response> => {
  const locale = params.locale ?? 'fr';

  try {
    const [menusRows, menuTrans, catsRows, catTrans, itemsRows, itemTrans] = await Promise.all([
      db.select().from(restaurantMenus).where(eq(restaurantMenus.isActive, true)).orderBy(asc(restaurantMenus.sortOrder)),
      db.select().from(restaurantMenuTranslations).where(eq(restaurantMenuTranslations.locale, locale)),
      db.select().from(menuCategories).where(eq(menuCategories.isActive, true)).orderBy(asc(menuCategories.sortOrder)),
      db.select().from(menuCategoryTranslations).where(eq(menuCategoryTranslations.locale, locale)),
      db.select().from(menuItems).where(eq(menuItems.isActive, true)).orderBy(asc(menuItems.sortOrder)),
      db.select().from(menuItemTranslations).where(eq(menuItemTranslations.locale, locale)),
    ]);

    const menuTransMap = new Map(menuTrans.map(t => [t.menuId, t]));
    const catTransMap = new Map(catTrans.map(t => [t.categoryId, t]));
    const itemTransMap = new Map(itemTrans.map(t => [t.itemId, t]));

    const menus = menusRows.map(menu => {
      const trans = menuTransMap.get(menu.id);
      return {
        id: menu.id,
        slug: menu.slug,
        price: menu.price ? parseFloat(menu.price) : null,
        year: menu.year,
        start_date: menu.startDate,
        end_date: menu.endDate,
        image_url: menu.imageUrl,
        is_active: menu.isActive,
        sort_order: menu.sortOrder,
        name: trans?.name ?? menu.slug,
        description: trans?.description ?? null,
      };
    });

    const categories = catsRows.map(cat => {
      const trans = catTransMap.get(cat.id);
      return {
        id: cat.id,
        menu_id: cat.menuId,
        slug: cat.slug,
        sort_order: cat.sortOrder,
        name: trans?.name ?? cat.slug,
        description: trans?.description ?? null,
      };
    });

    const items = itemsRows.map(item => {
      const trans = itemTransMap.get(item.id);
      return {
        id: item.id,
        category_id: item.categoryId,
        slug: item.slug,
        price: parseFloat(item.price),
        image_url: item.imageUrl,
        is_vegetarian: item.isVegetarian,
        is_vegan: item.isVegan,
        is_gluten_free: item.isGlutenFree,
        is_signature: item.isSignature,
        sort_order: item.sortOrder,
        name: trans?.name ?? item.slug,
        description: trans?.description ?? null,
      };
    });

    return new Response(JSON.stringify({ menus, categories, items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Menu API error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch menu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
