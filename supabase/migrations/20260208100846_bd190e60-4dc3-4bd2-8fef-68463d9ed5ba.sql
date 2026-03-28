
-- Create restaurant_menus table for event-based menus (Menu de Noël, Menu de Pâques, etc.)
CREATE TABLE public.restaurant_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translations for restaurant menus
CREATE TABLE public.restaurant_menu_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE(menu_id, locale)
);

-- Add menu_id to menu_categories to link categories to specific menus
ALTER TABLE public.menu_categories 
ADD COLUMN menu_id UUID REFERENCES public.restaurant_menus(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_translations ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurant_menus
CREATE POLICY "Anyone can view active restaurant menus" 
ON public.restaurant_menus FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can insert restaurant menus" 
ON public.restaurant_menus FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update restaurant menus" 
ON public.restaurant_menus FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete restaurant menus" 
ON public.restaurant_menus FOR DELETE 
USING (is_admin(auth.uid()));

-- RLS policies for restaurant_menu_translations
CREATE POLICY "Anyone can view menu translations" 
ON public.restaurant_menu_translations FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage menu translations" 
ON public.restaurant_menu_translations FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_restaurant_menus_updated_at
BEFORE UPDATE ON public.restaurant_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample menus
INSERT INTO public.restaurant_menus (slug, price, year, start_date, end_date, sort_order) VALUES
('menu-noel-2026', 125, 2026, '2026-12-20', '2026-12-26', 1),
('menu-saint-sylvestre-2026', 180, 2026, '2026-12-31', '2026-12-31', 2),
('menu-paques-2026', 85, 2026, '2026-04-05', '2026-04-06', 3),
('menu-saint-valentin-2026', 95, 2026, '2026-02-14', '2026-02-14', 4),
('menu-du-chef', 65, NULL, NULL, NULL, 5);

-- Insert translations for sample menus
INSERT INTO public.restaurant_menu_translations (menu_id, locale, name, description) 
SELECT id, 'fr', 'Menu de Noël', 'Un festin gastronomique pour célébrer les fêtes en famille' FROM public.restaurant_menus WHERE slug = 'menu-noel-2026'
UNION ALL
SELECT id, 'en', 'Christmas Menu', 'A gastronomic feast to celebrate the holidays with family' FROM public.restaurant_menus WHERE slug = 'menu-noel-2026'
UNION ALL
SELECT id, 'ar', 'قائمة عيد الميلاد', 'وليمة فاخرة للاحتفال بالعيد مع العائلة' FROM public.restaurant_menus WHERE slug = 'menu-noel-2026'
UNION ALL
SELECT id, 'zh', '圣诞菜单', '与家人共庆佳节的美食盛宴' FROM public.restaurant_menus WHERE slug = 'menu-noel-2026';

INSERT INTO public.restaurant_menu_translations (menu_id, locale, name, description) 
SELECT id, 'fr', 'Réveillon du Nouvel An', 'Une soirée exceptionnelle pour accueillir la nouvelle année' FROM public.restaurant_menus WHERE slug = 'menu-saint-sylvestre-2026'
UNION ALL
SELECT id, 'en', 'New Year''s Eve', 'An exceptional evening to welcome the new year' FROM public.restaurant_menus WHERE slug = 'menu-saint-sylvestre-2026'
UNION ALL
SELECT id, 'ar', 'ليلة رأس السنة', 'أمسية استثنائية لاستقبال العام الجديد' FROM public.restaurant_menus WHERE slug = 'menu-saint-sylvestre-2026'
UNION ALL
SELECT id, 'zh', '跨年晚宴', '迎接新年的特别之夜' FROM public.restaurant_menus WHERE slug = 'menu-saint-sylvestre-2026';

INSERT INTO public.restaurant_menu_translations (menu_id, locale, name, description) 
SELECT id, 'fr', 'Menu de Pâques', 'Célébrez le printemps avec notre menu pascal' FROM public.restaurant_menus WHERE slug = 'menu-paques-2026'
UNION ALL
SELECT id, 'en', 'Easter Menu', 'Celebrate spring with our Easter menu' FROM public.restaurant_menus WHERE slug = 'menu-paques-2026'
UNION ALL
SELECT id, 'ar', 'قائمة عيد الفصح', 'احتفلوا بالربيع مع قائمة عيد الفصح' FROM public.restaurant_menus WHERE slug = 'menu-paques-2026'
UNION ALL
SELECT id, 'zh', '复活节菜单', '用我们的复活节菜单庆祝春天' FROM public.restaurant_menus WHERE slug = 'menu-paques-2026';

INSERT INTO public.restaurant_menu_translations (menu_id, locale, name, description) 
SELECT id, 'fr', 'Menu Saint-Valentin', 'Un dîner romantique pour les amoureux' FROM public.restaurant_menus WHERE slug = 'menu-saint-valentin-2026'
UNION ALL
SELECT id, 'en', 'Valentine''s Day Menu', 'A romantic dinner for lovers' FROM public.restaurant_menus WHERE slug = 'menu-saint-valentin-2026'
UNION ALL
SELECT id, 'ar', 'قائمة عيد الحب', 'عشاء رومانسي للعاشقين' FROM public.restaurant_menus WHERE slug = 'menu-saint-valentin-2026'
UNION ALL
SELECT id, 'zh', '情人节菜单', '为情侣准备的浪漫晚餐' FROM public.restaurant_menus WHERE slug = 'menu-saint-valentin-2026';

INSERT INTO public.restaurant_menu_translations (menu_id, locale, name, description) 
SELECT id, 'fr', 'Menu du Chef', 'Notre sélection signature disponible toute l''année' FROM public.restaurant_menus WHERE slug = 'menu-du-chef'
UNION ALL
SELECT id, 'en', 'Chef''s Menu', 'Our signature selection available year-round' FROM public.restaurant_menus WHERE slug = 'menu-du-chef'
UNION ALL
SELECT id, 'ar', 'قائمة الشيف', 'مجموعتنا المميزة متاحة طوال العام' FROM public.restaurant_menus WHERE slug = 'menu-du-chef'
UNION ALL
SELECT id, 'zh', '主厨菜单', '全年供应的招牌精选' FROM public.restaurant_menus WHERE slug = 'menu-du-chef';

-- Link existing categories to Menu du Chef
UPDATE public.menu_categories 
SET menu_id = (SELECT id FROM public.restaurant_menus WHERE slug = 'menu-du-chef');
