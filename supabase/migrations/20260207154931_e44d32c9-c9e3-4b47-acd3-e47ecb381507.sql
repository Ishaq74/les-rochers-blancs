-- =====================================================
-- COMPLETE CMS/CRM/ERP DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- 1. SERVICES TABLE (for hotel/restaurant services)
-- =====================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE(service_id, locale)
);

-- =====================================================
-- 2. FORMATIONS TABLE (training/courses)
-- =====================================================
CREATE TABLE public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  duration TEXT,
  price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.formation_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  objectives TEXT,
  UNIQUE(formation_id, locale)
);

-- =====================================================
-- 3. BLOG SYSTEM
-- =====================================================
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  author_id UUID REFERENCES public.profiles(id),
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  UNIQUE(post_id, locale)
);

-- =====================================================
-- 4. COMMENTS SYSTEM
-- =====================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. CLIENTS CRM
-- =====================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. RESERVATIONS
-- =====================================================
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.reservation_type AS ENUM ('room', 'restaurant', 'service', 'formation');

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  type reservation_type NOT NULL,
  reference_id UUID,
  status reservation_status NOT NULL DEFAULT 'pending',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  guests_count INTEGER DEFAULT 1,
  special_requests TEXT,
  total_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. INVOICES SYSTEM
-- =====================================================
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  reservation_id UUID REFERENCES public.reservations(id),
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 20,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 8. QUOTES (DEVIS)
-- =====================================================
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  status quote_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 20,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  converted_invoice_id UUID REFERENCES public.invoices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 9. MEDIA LIBRARY
-- =====================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 10. THEME SETTINGS
-- =====================================================
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'color',
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 11. SITE SETTINGS
-- =====================================================
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - SERVICES
-- =====================================================
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view service translations" ON public.service_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service translations" ON public.service_translations
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - FORMATIONS
-- =====================================================
CREATE POLICY "Anyone can view active formations" ON public.formations
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage formations" ON public.formations
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view formation translations" ON public.formation_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage formation translations" ON public.formation_translations
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - BLOG
-- =====================================================
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
  FOR SELECT USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage posts" ON public.blog_posts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view post translations" ON public.blog_post_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage post translations" ON public.blog_post_translations
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - COMMENTS
-- =====================================================
CREATE POLICY "Anyone can view approved comments" ON public.comments
  FOR SELECT USING (is_approved = true OR is_admin(auth.uid()));

CREATE POLICY "Anyone can insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage comments" ON public.comments
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - CLIENTS
-- =====================================================
CREATE POLICY "Admins can view clients" ON public.clients
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage clients" ON public.clients
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - RESERVATIONS
-- =====================================================
CREATE POLICY "Admins can view reservations" ON public.reservations
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage reservations" ON public.reservations
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - INVOICES
-- =====================================================
CREATE POLICY "Admins can view invoices" ON public.invoices
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view invoice items" ON public.invoice_items
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage invoice items" ON public.invoice_items
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - QUOTES
-- =====================================================
CREATE POLICY "Admins can view quotes" ON public.quotes
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage quotes" ON public.quotes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view quote items" ON public.quote_items
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage quote items" ON public.quote_items
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - MEDIA
-- =====================================================
CREATE POLICY "Anyone can view media" ON public.media
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage media" ON public.media
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES - SETTINGS
-- =====================================================
CREATE POLICY "Anyone can view theme settings" ON public.theme_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage theme settings" ON public.theme_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formations_updated_at BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET FOR MEDIA
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update media files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete media files" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND is_admin(auth.uid()));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_services_slug ON public.services(slug);
CREATE INDEX idx_formations_slug ON public.formations(slug);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at);
CREATE INDEX idx_comments_post ON public.comments(post_id, is_approved);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_dates ON public.reservations(start_date, end_date);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_quotes_status ON public.quotes(status);