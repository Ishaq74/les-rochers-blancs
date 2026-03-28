import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useMenu } from '@/hooks/useMenu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Wheat, Star, Calendar, Euro, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, ar, zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export const MenuSection = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0];
  const { menus, getCategoriesByMenu, getItemsByCategory, isLoading, error } = useMenu(currentLanguage);
  const isRTL = currentLanguage === 'ar';

  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'fr': return fr;
      case 'ar': return ar;
      case 'zh': return zhCN;
      default: return enUS;
    }
  };

  const formatMenuDate = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return null;
    const locale = getDateLocale();
    const start = new Date(startDate);
    
    if (!endDate || startDate === endDate) {
      return format(start, 'd MMMM yyyy', { locale });
    }
    
    const end = new Date(endDate);
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'd', { locale })} - ${format(end, 'd MMMM yyyy', { locale })}`;
    }
    return `${format(start, 'd MMMM', { locale })} - ${format(end, 'd MMMM yyyy', { locale })}`;
  };

  const isMenuActive = (startDate: string | null, endDate: string | null): boolean | null => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const now = new Date();
    return now >= start && now <= end;
  };

  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const isChefMenu = (name: string) => {
    const normalized = normalize(name);
    return normalized.includes('chef') || normalized.includes('signature');
  };

  const activeMenus = menus.filter((menu) => isMenuActive(menu.start_date, menu.end_date) === true);
  const defaultMenuId =
    activeMenus.find((menu) => isChefMenu(menu.name))?.id ||
    activeMenus[0]?.id ||
    menus.find((menu) => isChefMenu(menu.name))?.id ||
    menus[0]?.id;

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || menus.length === 0) {
    return null;
  }

  return (
    <section id="menu" className="section-padding bg-secondary" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-section"
        >
          <h2 className="heading-section mb-3">
            {t('menuSection.title')}
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            {t('menuSection.subtitle')}
          </p>
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="font-semibold"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              {t('menuSection.print')}
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue={defaultMenuId} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
            {menus.map((menu) => {
              const activeNow = isMenuActive(menu.start_date, menu.end_date);

              return (
                <TabsTrigger
                  key={menu.id}
                  value={menu.id}
                  className={`px-6 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-full border data-[state=active]:border-accent transition-all ${
                    activeNow === true
                      ? 'border-green-500/50 bg-green-500/10'
                      : activeNow === false
                        ? 'border-border/70 bg-background/70'
                        : 'border-border'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {menu.name}
                    {activeNow === true && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-300 px-2 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('openings.statusOpen')}
                      </span>
                    )}
                    {activeNow === false && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        {t('openings.statusClosed')}
                      </span>
                    )}
                    {menu.price && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {menu.price}€
                      </span>
                    )}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {menus.map((menu) => {
            const menuCategories = getCategoriesByMenu(menu.id);
            
            return (
              <TabsContent key={menu.id} value={menu.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Menu header with price and dates */}
                  <div className="text-center pb-6 border-b border-border">
                    {menu.description && (
                      <p className="text-muted-foreground italic mb-4 max-w-2xl mx-auto">
                        {menu.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-6 text-sm">
                      {menu.price && (
                        <div className="flex items-center gap-2 text-accent font-semibold text-lg">
                          <Euro className="w-5 h-5" />
                          <span>{menu.price}€ / {t('menuSection.person')}</span>
                        </div>
                      )}
                      {menu.start_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatMenuDate(menu.start_date, menu.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categories and items */}
                  {menuCategories.map((category, catIndex) => {
                    const categoryItems = getItemsByCategory(category.id);
                    
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: catIndex * 0.1 }}
                        className="space-y-4"
                      >
                        <h3 className="heading-subsection text-center">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-center text-muted-foreground text-sm italic">
                            {category.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.05 }}
                              className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-accent/50 hover:shadow-elegant transition-all"
                            >
                              {item.image_url && (
                                <div className="h-44 overflow-hidden">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              )}
                              <div className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="heading-card group-hover:text-accent transition-colors">
                                        {item.name}
                                      </h4>
                                      {item.is_signature && (
                                        <Star className="w-4 h-4 text-accent fill-accent" />
                                      )}
                                      {item.is_vegetarian && (
                                        <Leaf className="w-4 h-4 text-primary" aria-label={t('menuSection.vegetarian')} />
                                      )}
                                      {item.is_vegan && (
                                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">V</span>
                                      )}
                                      {item.is_gluten_free && (
                                        <Wheat className="w-4 h-4 text-accent" aria-label={t('menuSection.glutenFree')} />
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  {/* Only show individual price if menu has no global price */}
                                  {!menu.price && item.price > 0 && (
                                    <div className="text-accent font-serif text-lg font-bold whitespace-nowrap">
                                      {item.price.toFixed(0)}€
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}

                  {menuCategories.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {t('menuSection.comingSoon')}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 pt-8 border-t border-border"
        >
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              <span>{t('menuSection.vegetarian')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wheat className="w-4 h-4 text-accent" />
              <span>{t('menuSection.glutenFree')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>{t('menuSection.chefSignature')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
