import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Leaf, Wheat, Star, Calendar, Euro, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SUPPORTED_LOCALES } from '@/lib/i18n-utils';

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
  translations: Record<string, { name: string; description: string }>;
}

interface MenuCategory {
  id: string;
  menu_id: string | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, { name: string; description: string }>;
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
  is_active: boolean;
  sort_order: number;
  translations: Record<string, { name: string; description: string }>;
}

const LOCALES = SUPPORTED_LOCALES;
const LOCALE_NAMES: Record<string, string> = { fr: 'FR', en: 'EN', ar: 'AR', zh: 'ZH' };

const MenuManager = () => {
  const { toast } = useToast();
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // Menu form
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<RestaurantMenu | null>(null);
  const [menuForm, setMenuForm] = useState({
    slug: '',
    price: null as number | null,
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    image_url: '',
    is_active: true,
    sort_order: 0,
    translations: {} as Record<string, { name: string; description: string }>,
  });

  // Category form
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [selectedMenuForCategory, setSelectedMenuForCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    sort_order: 0,
    is_active: true,
    translations: {} as Record<string, { name: string; description: string }>,
  });

  // Item form
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    slug: '',
    price: 0,
    image_url: '',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_signature: false,
    is_active: true,
    sort_order: 0,
    translations: {} as Record<string, { name: string; description: string }>,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch menus
      const { data: menusData, error: menusError } = await supabase
        .from('restaurant_menus')
        .select('*')
        .order('sort_order');
      if (menusError) throw menusError;

      const { data: menuTransData } = await supabase
        .from('restaurant_menu_translations')
        .select('*');

      const menusWithTrans = (menusData || []).map((menu) => {
        const translations: Record<string, { name: string; description: string }> = {};
        (menuTransData || [])
          .filter((t) => t.menu_id === menu.id)
          .forEach((t) => {
            translations[t.locale] = { name: t.name, description: t.description || '' };
          });
        return { ...menu, translations };
      });
      setMenus(menusWithTrans);

      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');
      if (catError) throw catError;

      const { data: catTransData } = await supabase
        .from('menu_category_translations')
        .select('*');

      const categoriesWithTrans = (categoriesData || []).map((cat) => {
        const translations: Record<string, { name: string; description: string }> = {};
        (catTransData || [])
          .filter((t) => t.category_id === cat.id)
          .forEach((t) => {
            translations[t.locale] = { name: t.name, description: t.description || '' };
          });
        return { ...cat, translations };
      });
      setCategories(categoriesWithTrans);

      // Fetch items
      const { data: itemsData, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order');
      if (itemError) throw itemError;

      const { data: itemTransData } = await supabase
        .from('menu_item_translations')
        .select('*');

      const itemsWithTrans = (itemsData || []).map((item) => {
        const translations: Record<string, { name: string; description: string }> = {};
        (itemTransData || [])
          .filter((t) => t.item_id === item.id)
          .forEach((t) => {
            translations[t.locale] = { name: t.name, description: t.description || '' };
          });
        return { ...item, translations };
      });
      setMenuItems(itemsWithTrans);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les menus', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenuExpanded = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  // Menu handlers
  const openMenuDialog = (menu?: RestaurantMenu) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        slug: menu.slug,
        price: menu.price,
        year: menu.year || new Date().getFullYear(),
        start_date: menu.start_date || '',
        end_date: menu.end_date || '',
        image_url: menu.image_url || '',
        is_active: menu.is_active,
        sort_order: menu.sort_order,
        translations: { ...menu.translations },
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        slug: '',
        price: null,
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        image_url: '',
        is_active: true,
        sort_order: menus.length,
        translations: {},
      });
    }
    setMenuDialogOpen(true);
  };

  const saveMenu = async () => {
    try {
      let menuId: string;
      const menuData = {
        slug: menuForm.slug,
        price: menuForm.price,
        year: menuForm.year,
        start_date: menuForm.start_date || null,
        end_date: menuForm.end_date || null,
        image_url: menuForm.image_url || null,
        is_active: menuForm.is_active,
        sort_order: menuForm.sort_order,
      };

      if (editingMenu) {
        const { error } = await supabase.from('restaurant_menus').update(menuData).eq('id', editingMenu.id);
        if (error) throw error;
        menuId = editingMenu.id;
      } else {
        const { data, error } = await supabase.from('restaurant_menus').insert(menuData).select().single();
        if (error) throw error;
        menuId = data.id;
      }

      // Save translations
      for (const locale of LOCALES) {
        const trans = menuForm.translations[locale];
        if (trans?.name) {
          await supabase.from('restaurant_menu_translations').upsert({
            menu_id: menuId,
            locale,
            name: trans.name,
            description: trans.description || null,
          }, { onConflict: 'menu_id,locale' });
        }
      }

      toast({ title: 'Succès', description: 'Menu sauvegardé' });
      setMenuDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const deleteMenu = async (id: string) => {
    if (!confirm('Supprimer ce menu et toutes ses catégories/plats ?')) return;
    try {
      const { error } = await supabase.from('restaurant_menus').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Supprimé', description: 'Menu supprimé' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  // Category handlers
  const openCategoryDialog = (menuId: string, category?: MenuCategory) => {
    setSelectedMenuForCategory(menuId);
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        slug: category.slug,
        sort_order: category.sort_order,
        is_active: category.is_active,
        translations: { ...category.translations },
      });
    } else {
      setEditingCategory(null);
      const menuCategories = categories.filter((c) => c.menu_id === menuId);
      setCategoryForm({
        slug: '',
        sort_order: menuCategories.length,
        is_active: true,
        translations: {},
      });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    try {
      let categoryId: string;
      const catData = {
        menu_id: selectedMenuForCategory,
        slug: categoryForm.slug,
        sort_order: categoryForm.sort_order,
        is_active: categoryForm.is_active,
      };

      if (editingCategory) {
        const { error } = await supabase.from('menu_categories').update(catData).eq('id', editingCategory.id);
        if (error) throw error;
        categoryId = editingCategory.id;
      } else {
        const { data, error } = await supabase.from('menu_categories').insert(catData).select().single();
        if (error) throw error;
        categoryId = data.id;
      }

      for (const locale of LOCALES) {
        const trans = categoryForm.translations[locale];
        if (trans?.name) {
          await supabase.from('menu_category_translations').upsert({
            category_id: categoryId,
            locale,
            name: trans.name,
            description: trans.description || null,
          }, { onConflict: 'category_id,locale' });
        }
      }

      toast({ title: 'Succès', description: 'Catégorie sauvegardée' });
      setCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et tous ses plats ?')) return;
    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Supprimé', description: 'Catégorie supprimée' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  // Item handlers
  const openItemDialog = (categoryId: string, item?: MenuItem) => {
    setSelectedCategoryForItem(categoryId);
    if (item) {
      setEditingItem(item);
      setItemForm({
        slug: item.slug,
        price: item.price,
        image_url: item.image_url || '',
        is_vegetarian: item.is_vegetarian,
        is_vegan: item.is_vegan,
        is_gluten_free: item.is_gluten_free,
        is_signature: item.is_signature,
        is_active: item.is_active,
        sort_order: item.sort_order,
        translations: { ...item.translations },
      });
    } else {
      setEditingItem(null);
      const catItems = menuItems.filter((i) => i.category_id === categoryId);
      setItemForm({
        slug: '',
        price: 0,
        image_url: '',
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        is_signature: false,
        is_active: true,
        sort_order: catItems.length,
        translations: {},
      });
    }
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    try {
      let itemId: string;
      const itemData = {
        category_id: selectedCategoryForItem,
        slug: itemForm.slug,
        price: itemForm.price,
        image_url: itemForm.image_url || null,
        is_vegetarian: itemForm.is_vegetarian,
        is_vegan: itemForm.is_vegan,
        is_gluten_free: itemForm.is_gluten_free,
        is_signature: itemForm.is_signature,
        is_active: itemForm.is_active,
        sort_order: itemForm.sort_order,
      };

      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
        itemId = editingItem.id;
      } else {
        const { data, error } = await supabase.from('menu_items').insert(itemData).select().single();
        if (error) throw error;
        itemId = data.id;
      }

      for (const locale of LOCALES) {
        const trans = itemForm.translations[locale];
        if (trans?.name) {
          await supabase.from('menu_item_translations').upsert({
            item_id: itemId,
            locale,
            name: trans.name,
            description: trans.description || null,
          }, { onConflict: 'item_id,locale' });
        }
      }

      toast({ title: 'Succès', description: 'Plat sauvegardé' });
      setItemDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer ce plat ?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Supprimé', description: 'Plat supprimé' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  const duplicateMenu = async (menu: RestaurantMenu) => {
    const newYear = (menu.year || new Date().getFullYear()) + 1;
    const newSlug = menu.slug.replace(/\d{4}/, String(newYear));
    
    try {
      const { data: newMenu, error } = await supabase.from('restaurant_menus').insert({
        slug: newSlug,
        price: menu.price,
        year: newYear,
        start_date: menu.start_date?.replace(/\d{4}/, String(newYear)) || null,
        end_date: menu.end_date?.replace(/\d{4}/, String(newYear)) || null,
        is_active: false,
        sort_order: menus.length,
      }).select().single();
      
      if (error) throw error;

      // Copy translations
      for (const locale of LOCALES) {
        const trans = menu.translations[locale];
        if (trans?.name) {
          await supabase.from('restaurant_menu_translations').insert({
            menu_id: newMenu.id,
            locale,
            name: trans.name.replace(/\d{4}/, String(newYear)),
            description: trans.description,
          });
        }
      }

      // Copy categories and items
      const menuCategories = categories.filter((c) => c.menu_id === menu.id);
      for (const cat of menuCategories) {
        const { data: newCat } = await supabase.from('menu_categories').insert({
          menu_id: newMenu.id,
          slug: cat.slug,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
        }).select().single();

        if (newCat) {
          for (const locale of LOCALES) {
            const trans = cat.translations[locale];
            if (trans?.name) {
              await supabase.from('menu_category_translations').insert({
                category_id: newCat.id,
                locale,
                name: trans.name,
                description: trans.description,
              });
            }
          }

          const catItems = menuItems.filter((i) => i.category_id === cat.id);
          for (const item of catItems) {
            const { data: newItem } = await supabase.from('menu_items').insert({
              category_id: newCat.id,
              slug: item.slug,
              price: item.price,
              is_vegetarian: item.is_vegetarian,
              is_vegan: item.is_vegan,
              is_gluten_free: item.is_gluten_free,
              is_signature: item.is_signature,
              is_active: item.is_active,
              sort_order: item.sort_order,
            }).select().single();

            if (newItem) {
              for (const locale of LOCALES) {
                const trans = item.translations[locale];
                if (trans?.name) {
                  await supabase.from('menu_item_translations').insert({
                    item_id: newItem.id,
                    locale,
                    name: trans.name,
                    description: trans.description,
                  });
                }
              }
            }
          }
        }
      }

      toast({ title: 'Succès', description: `Menu dupliqué pour ${newYear}` });
      fetchData();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de dupliquer', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Gestion des Menus</h1>
            <p className="text-muted-foreground mt-2">
              Menus événementiels (Noël, Pâques, Saint-Valentin...) avec catégories et plats
            </p>
          </div>
          <Button onClick={() => openMenuDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau menu
          </Button>
        </div>

        {/* Menus list with nested categories and items */}
        <div className="space-y-4">
          {menus.map((menu) => {
            const menuCategories = categories.filter((c) => c.menu_id === menu.id);
            const isExpanded = expandedMenus.includes(menu.id);

            return (
              <Card key={menu.id} className="border-border">
                <Collapsible open={isExpanded} onOpenChange={() => toggleMenuExpanded(menu.id)}>
                  <div className="p-4 flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <div className={`w-3 h-3 rounded-full ${menu.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div className="flex-1">
                        <div className="font-serif text-lg font-semibold flex items-center gap-3">
                          {menu.translations.fr?.name || menu.slug}
                          {menu.price && (
                            <span className="text-sm bg-accent/10 text-accent px-2 py-0.5 rounded-full font-normal">
                              {menu.price}€
                            </span>
                          )}
                          {menu.year && (
                            <span className="text-sm bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-normal">
                              {menu.year}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {menu.start_date && (
                            <>
                              <Calendar className="w-3 h-3" />
                              {menu.start_date} {menu.end_date && menu.end_date !== menu.start_date && `→ ${menu.end_date}`}
                            </>
                          )}
                          <span>• {menuCategories.length} catégories</span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => duplicateMenu(menu)} title="Dupliquer pour l'année suivante">
                        Dupliquer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openMenuDialog(menu)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMenu(menu.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Catégories du menu</span>
                        <Button size="sm" variant="outline" onClick={() => openCategoryDialog(menu.id)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Catégorie
                        </Button>
                      </div>

                      {menuCategories.map((category) => {
                        const catItems = menuItems.filter((i) => i.category_id === category.id);
                        
                        return (
                          <div key={category.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="font-medium">{category.translations.fr?.name || category.slug}</span>
                                <span className="text-xs text-muted-foreground">({catItems.length} plats)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openItemDialog(category.id)}>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Plat
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openCategoryDialog(menu.id, category)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deleteCategory(category.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {catItems.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                                {catItems.map((item) => (
                                  <div key={item.id} className="bg-background rounded p-2 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                      <span>{item.translations.fr?.name || item.slug}</span>
                                      {item.is_signature && <Star className="w-3 h-3 text-accent fill-accent" />}
                                      {item.is_vegetarian && <Leaf className="w-3 h-3 text-green-500" />}
                                      {item.is_gluten_free && <Wheat className="w-3 h-3 text-amber-500" />}
                                      {item.price > 0 && !menu.price && (
                                        <span className="text-muted-foreground">{item.price}€</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => openItemDialog(category.id, item)}>
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive" onClick={() => deleteItem(item.id)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {menuCategories.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          Aucune catégorie. Ajoutez "Entrées", "Plats", "Desserts"...
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {menus.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun menu. Créez votre premier menu événementiel !
            </div>
          )}
        </div>

        {/* Menu Dialog */}
        <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMenu ? 'Modifier' : 'Nouveau'} menu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (identifiant)</Label>
                  <Input
                    value={menuForm.slug}
                    onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                    placeholder="menu-noel-2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix global (€)</Label>
                  <Input
                    type="number"
                    value={menuForm.price || ''}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="95"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input
                    type="number"
                    value={menuForm.year || ''}
                    onChange={(e) => setMenuForm({ ...menuForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={menuForm.start_date}
                    onChange={(e) => setMenuForm({ ...menuForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={menuForm.end_date}
                    onChange={(e) => setMenuForm({ ...menuForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={menuForm.is_active}
                  onCheckedChange={(checked) => setMenuForm({ ...menuForm, is_active: checked })}
                />
                <Label>Menu actif (visible sur le site)</Label>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Traductions</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-4">
                    {LOCALES.map((locale) => (
                      <TabsTrigger key={locale} value={locale}>{LOCALE_NAMES[locale]}</TabsTrigger>
                    ))}
                  </TabsList>
                  {LOCALES.map((locale) => (
                    <TabsContent key={locale} value={locale} className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom du menu</Label>
                        <Input
                          value={menuForm.translations[locale]?.name || ''}
                          onChange={(e) => setMenuForm({
                            ...menuForm,
                            translations: {
                              ...menuForm.translations,
                              [locale]: { ...menuForm.translations[locale], name: e.target.value },
                            },
                          })}
                          placeholder="Menu de Noël"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={menuForm.translations[locale]?.description || ''}
                          onChange={(e) => setMenuForm({
                            ...menuForm,
                            translations: {
                              ...menuForm.translations,
                              [locale]: { ...menuForm.translations[locale], description: e.target.value },
                            },
                          })}
                          placeholder="Un festin gastronomique..."
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>Annuler</Button>
              <Button onClick={saveMenu} className="bg-accent text-accent-foreground">Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Modifier' : 'Nouvelle'} catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (identifiant)</Label>
                  <Input
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="entrees, plats, desserts..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                />
                <Label>Catégorie active</Label>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Traductions</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-4">
                    {LOCALES.map((locale) => (
                      <TabsTrigger key={locale} value={locale}>{LOCALE_NAMES[locale]}</TabsTrigger>
                    ))}
                  </TabsList>
                  {LOCALES.map((locale) => (
                    <TabsContent key={locale} value={locale} className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={categoryForm.translations[locale]?.name || ''}
                          onChange={(e) => setCategoryForm({
                            ...categoryForm,
                            translations: {
                              ...categoryForm.translations,
                              [locale]: { ...categoryForm.translations[locale], name: e.target.value },
                            },
                          })}
                          placeholder="Entrées, Plats, Desserts..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optionnel)</Label>
                        <Textarea
                          value={categoryForm.translations[locale]?.description || ''}
                          onChange={(e) => setCategoryForm({
                            ...categoryForm,
                            translations: {
                              ...categoryForm.translations,
                              [locale]: { ...categoryForm.translations[locale], description: e.target.value },
                            },
                          })}
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Annuler</Button>
              <Button onClick={saveCategory} className="bg-accent text-accent-foreground">Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Modifier' : 'Nouveau'} plat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (identifiant)</Label>
                  <Input
                    value={itemForm.slug}
                    onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value })}
                    placeholder="foie-gras-mi-cuit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix (€) - si menu à la carte</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={itemForm.is_signature} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_signature: checked })} />
                  <Label className="flex items-center gap-1"><Star className="w-4 h-4 text-accent" /> Signature</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={itemForm.is_vegetarian} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_vegetarian: checked })} />
                  <Label className="flex items-center gap-1"><Leaf className="w-4 h-4 text-green-500" /> Végétarien</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={itemForm.is_vegan} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_vegan: checked })} />
                  <Label>Végan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={itemForm.is_gluten_free} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_gluten_free: checked })} />
                  <Label className="flex items-center gap-1"><Wheat className="w-4 h-4 text-amber-500" /> Sans gluten</Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.is_active}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, is_active: checked })}
                />
                <Label>Plat actif</Label>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Traductions</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-4">
                    {LOCALES.map((locale) => (
                      <TabsTrigger key={locale} value={locale}>{LOCALE_NAMES[locale]}</TabsTrigger>
                    ))}
                  </TabsList>
                  {LOCALES.map((locale) => (
                    <TabsContent key={locale} value={locale} className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom du plat</Label>
                        <Input
                          value={itemForm.translations[locale]?.name || ''}
                          onChange={(e) => setItemForm({
                            ...itemForm,
                            translations: {
                              ...itemForm.translations,
                              [locale]: { ...itemForm.translations[locale], name: e.target.value },
                            },
                          })}
                          placeholder="Foie gras mi-cuit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={itemForm.translations[locale]?.description || ''}
                          onChange={(e) => setItemForm({
                            ...itemForm,
                            translations: {
                              ...itemForm.translations,
                              [locale]: { ...itemForm.translations[locale], description: e.target.value },
                            },
                          })}
                          placeholder="Servi avec son chutney de figues..."
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Annuler</Button>
              <Button onClick={saveItem} className="bg-accent text-accent-foreground">Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default MenuManager;
