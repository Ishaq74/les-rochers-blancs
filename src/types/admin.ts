// =====================================================
// ADMIN TYPES - Complete CMS/CRM/ERP
// =====================================================

// Services
export interface Service {
  id: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  translations?: ServiceTranslation[];
}

export interface ServiceTranslation {
  id: string;
  service_id: string;
  locale: string;
  name: string;
  description: string | null;
}

// Formations
export interface Formation {
  id: string;
  slug: string;
  image_url: string | null;
  duration: string | null;
  price: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  translations?: FormationTranslation[];
}

export interface FormationTranslation {
  id: string;
  formation_id: string;
  locale: string;
  name: string;
  description: string | null;
  objectives: string | null;
}

// Blog
export interface BlogPost {
  id: string;
  slug: string;
  author_id: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  translations?: BlogPostTranslation[];
  author?: { full_name: string | null; email: string };
}

export interface BlogPostTranslation {
  id: string;
  post_id: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

// Comments
export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  is_rejected: boolean;
  created_at: string;
  post?: { slug: string; translations: { title: string; locale: string }[] };
}

// Clients
export interface Client {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Reservations
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ReservationType = 'room' | 'restaurant' | 'service' | 'formation';

export interface Reservation {
  id: string;
  client_id: string | null;
  type: ReservationType;
  reference_id: string | null;
  status: ReservationStatus;
  start_date: string;
  end_date: string | null;
  guests_count: number | null;
  special_requests: string | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

// Invoices
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  reservation_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

// Quotes
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string | null;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  converted_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

// Media
export interface Media {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  alt_text: string | null;
  folder: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// Theme Settings
export interface ThemeSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  updated_at: string;
}

// Site Settings
export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  updated_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalClients: number;
  totalReservations: number;
  pendingReservations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalBlogPosts: number;
  pendingComments: number;
}
