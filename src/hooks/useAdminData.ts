import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Service,
  Formation,
  BlogPost,
  Comment,
  Client,
  Reservation,
  Invoice,
  Quote,
  Media,
  ThemeSetting,
  SiteSetting,
  DashboardStats,
} from '@/types/admin';

// =====================================================
// DASHBOARD STATS
// =====================================================
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        clientsRes,
        reservationsRes,
        pendingReservationsRes,
        invoicesRes,
        unpaidInvoicesRes,
        quotesRes,
        pendingQuotesRes,
        blogRes,
        commentsRes,
        revenueRes,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['sent', 'overdue']),
        supabase.from('quotes').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('is_approved', false).eq('is_rejected', false),
        supabase.from('invoices').select('total').eq('status', 'paid'),
      ]);

      const totalRevenue = (revenueRes.data || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

      return {
        totalClients: clientsRes.count || 0,
        totalReservations: reservationsRes.count || 0,
        pendingReservations: pendingReservationsRes.count || 0,
        totalRevenue,
        monthlyRevenue: totalRevenue,
        totalInvoices: invoicesRes.count || 0,
        unpaidInvoices: unpaidInvoicesRes.count || 0,
        totalQuotes: quotesRes.count || 0,
        pendingQuotes: pendingQuotesRes.count || 0,
        totalBlogPosts: blogRes.count || 0,
        pendingComments: commentsRes.count || 0,
      };
    },
  });
};

// =====================================================
// SERVICES
// =====================================================
export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, translations:service_translations(*)')
        .order('sort_order');
      if (error) throw error;
      return data as Service[];
    },
  });
};

export const useServiceMutations = () => {
  const queryClient = useQueryClient();

  const createService = useMutation({
    mutationFn: async (service: { slug: string; icon?: string; image_url?: string; is_active?: boolean; sort_order?: number; translations: { locale: string; name: string; description?: string }[] }) => {
      const { translations, ...serviceData } = service;
      const { data, error } = await supabase.from('services').insert([serviceData]).select().single();
      if (error) throw error;
      
      if (translations?.length) {
        const translationsWithId = translations.map(t => ({ ...t, service_id: data.id }));
        await supabase.from('service_translations').insert(translationsWithId);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string; translations?: any[] }) => {
      const { translations, ...serviceData } = data;
      const { error } = await supabase.from('services').update(serviceData).eq('id', id);
      if (error) throw error;
      
      if (translations) {
        await supabase.from('service_translations').delete().eq('service_id', id);
        const translationsWithId = translations.map(t => ({ ...t, service_id: id }));
        await supabase.from('service_translations').insert(translationsWithId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  return { createService, updateService, deleteService };
};

// =====================================================
// FORMATIONS
// =====================================================
export const useFormations = () => {
  return useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formations')
        .select('*, translations:formation_translations(*)')
        .order('sort_order');
      if (error) throw error;
      return data as Formation[];
    },
  });
};

export const useFormationMutations = () => {
  const queryClient = useQueryClient();

  const createFormation = useMutation({
    mutationFn: async (formation: { slug: string; image_url?: string; duration?: string; price?: number; is_active?: boolean; sort_order?: number; translations: { locale: string; name: string; description?: string; objectives?: string }[] }) => {
      const { translations, ...formationData } = formation;
      const { data, error } = await supabase.from('formations').insert([formationData]).select().single();
      if (error) throw error;
      
      if (translations?.length) {
        const translationsWithId = translations.map(t => ({ ...t, formation_id: data.id }));
        await supabase.from('formation_translations').insert(translationsWithId);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formations'] }),
  });

  const updateFormation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Formation> & { id: string; translations?: any[] }) => {
      const { translations, ...formationData } = data;
      const { error } = await supabase.from('formations').update(formationData).eq('id', id);
      if (error) throw error;
      
      if (translations) {
        await supabase.from('formation_translations').delete().eq('formation_id', id);
        const translationsWithId = translations.map(t => ({ ...t, formation_id: id }));
        await supabase.from('formation_translations').insert(translationsWithId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formations'] }),
  });

  const deleteFormation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formations'] }),
  });

  return { createFormation, updateFormation, deleteFormation };
};

// =====================================================
// BLOG POSTS
// =====================================================
export const useBlogPosts = () => {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, translations:blog_post_translations(*), author:profiles(full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useBlogPostMutations = () => {
  const queryClient = useQueryClient();

  const createBlogPost = useMutation({
    mutationFn: async (post: { slug: string; author_id?: string; image_url?: string; is_published?: boolean; translations: { locale: string; title: string; excerpt?: string; content?: string; meta_title?: string; meta_description?: string }[] }) => {
      const { translations, ...postData } = post;
      const { data, error } = await supabase.from('blog_posts').insert([postData]).select().single();
      if (error) throw error;
      
      if (translations?.length) {
        const translationsWithId = translations.map(t => ({ ...t, post_id: data.id }));
        await supabase.from('blog_post_translations').insert(translationsWithId);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const updateBlogPost = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BlogPost> & { id: string; translations?: any[] }) => {
      const { translations, ...postData } = data;
      const { error } = await supabase.from('blog_posts').update(postData).eq('id', id);
      if (error) throw error;
      
      if (translations) {
        await supabase.from('blog_post_translations').delete().eq('post_id', id);
        const translationsWithId = translations.map(t => ({ ...t, post_id: id }));
        await supabase.from('blog_post_translations').insert(translationsWithId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const deleteBlogPost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const publishBlogPost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const unpublishBlogPost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  return { createBlogPost, updateBlogPost, deleteBlogPost, publishBlogPost, unpublishBlogPost };
};

// =====================================================
// COMMENTS
// =====================================================
export const useComments = () => {
  return useQuery({
    queryKey: ['comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, post:blog_posts(slug, translations:blog_post_translations(title, locale))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Comment[];
    },
  });
};

export const useCommentMutations = () => {
  const queryClient = useQueryClient();

  const approveComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: true, is_rejected: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments'] }),
  });

  const rejectComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: false, is_rejected: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments'] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments'] }),
  });

  return { approveComment, rejectComment, deleteComment };
};

// =====================================================
// CLIENTS
// =====================================================
export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });
};

export const useClientMutations = () => {
  const queryClient = useQueryClient();

  const createClient = useMutation({
    mutationFn: async (client: { first_name: string; last_name: string; email: string; phone?: string; company?: string; address?: string; city?: string; postal_code?: string; country?: string; notes?: string; tags?: string[]; is_active?: boolean }) => {
      const { data, error } = await supabase.from('clients').insert([client]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { error } = await supabase.from('clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return { createClient, updateClient, deleteClient };
};

// =====================================================
// RESERVATIONS
// =====================================================
export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, client:clients(*)')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as Reservation[];
    },
  });
};

export const useReservationMutations = () => {
  const queryClient = useQueryClient();

  const createReservation = useMutation({
    mutationFn: async (reservation: { client_id?: string; type: 'room' | 'restaurant' | 'service' | 'formation'; reference_id?: string; status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'; start_date: string; end_date?: string; guests_count?: number; special_requests?: string; total_amount?: number; notes?: string }) => {
      const { data, error } = await supabase.from('reservations').insert([reservation]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const updateReservation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Reservation> & { id: string }) => {
      const { error } = await supabase.from('reservations').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  return { createReservation, updateReservation, deleteReservation };
};

// =====================================================
// INVOICES
// =====================================================
export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, client:clients(*), items:invoice_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });
};

export const useInvoiceMutations = () => {
  const queryClient = useQueryClient();

  const createInvoice = useMutation({
    mutationFn: async (invoice: { invoice_number: string; client_id?: string; reservation_id?: string; status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'; issue_date?: string; due_date: string; subtotal?: number; tax_rate?: number; tax_amount?: number; total?: number; notes?: string; items?: { description: string; quantity: number; unit_price: number; total: number }[] }) => {
      const { items, ...invoiceData } = invoice;
      const { data, error } = await supabase.from('invoices').insert([invoiceData]).select().single();
      if (error) throw error;
      
      if (items?.length) {
        const itemsWithId = items.map((item, index) => ({ 
          ...item, 
          invoice_id: data.id,
          sort_order: index 
        }));
        await supabase.from('invoice_items').insert(itemsWithId);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: string; items?: any[] }) => {
      const { items, ...invoiceData } = data;
      const { error } = await supabase.from('invoices').update(invoiceData).eq('id', id);
      if (error) throw error;
      
      if (items) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        const itemsWithId = items.map((item, index) => ({ 
          ...item, 
          invoice_id: id,
          sort_order: index 
        }));
        await supabase.from('invoice_items').insert(itemsWithId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  return { createInvoice, updateInvoice, deleteInvoice };
};

// =====================================================
// QUOTES
// =====================================================
export const useQuotes = () => {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, client:clients(*), items:quote_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
  });
};

export const useQuoteMutations = () => {
  const queryClient = useQueryClient();

  const createQuote = useMutation({
    mutationFn: async (quote: { quote_number: string; client_id?: string; status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'; issue_date?: string; valid_until: string; subtotal?: number; tax_rate?: number; tax_amount?: number; total?: number; notes?: string; items?: { description: string; quantity: number; unit_price: number; total: number }[] }) => {
      const { items, ...quoteData } = quote;
      const { data, error } = await supabase.from('quotes').insert([quoteData]).select().single();
      if (error) throw error;
      
      if (items?.length) {
        const itemsWithId = items.map((item, index) => ({ 
          ...item, 
          quote_id: data.id,
          sort_order: index 
        }));
        await supabase.from('quote_items').insert(itemsWithId);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Quote> & { id: string; items?: any[] }) => {
      const { items, ...quoteData } = data;
      const { error } = await supabase.from('quotes').update(quoteData).eq('id', id);
      if (error) throw error;
      
      if (items) {
        await supabase.from('quote_items').delete().eq('quote_id', id);
        const itemsWithId = items.map((item, index) => ({ 
          ...item, 
          quote_id: id,
          sort_order: index 
        }));
        await supabase.from('quote_items').insert(itemsWithId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const convertToInvoice = useMutation({
    mutationFn: async (quoteId: string) => {
      // Get the quote with items
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*, items:quote_items(*)')
        .eq('id', quoteId)
        .single();
      if (quoteError) throw quoteError;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: quote.client_id,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: quote.subtotal,
          tax_rate: quote.tax_rate,
          tax_amount: quote.tax_amount,
          total: quote.total,
          notes: quote.notes,
        })
        .select()
        .single();
      if (invoiceError) throw invoiceError;

      // Copy items
      if (quote.items?.length) {
        const invoiceItems = quote.items.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          sort_order: item.sort_order,
        }));
        await supabase.from('invoice_items').insert(invoiceItems);
      }

      // Update quote status
      await supabase
        .from('quotes')
        .update({ status: 'converted', converted_invoice_id: invoice.id })
        .eq('id', quoteId);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return { createQuote, updateQuote, deleteQuote, convertToInvoice };
};

// =====================================================
// MEDIA
// =====================================================
export const useMedia = () => {
  return useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
  });
};

export const useMediaMutations = () => {
  const queryClient = useQueryClient();

  const uploadMedia = useMutation({
    mutationFn: async (file: File) => {
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filename, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filename);

      const { data, error } = await supabase
        .from('media')
        .insert({
          filename,
          original_filename: file.name,
          file_path: filename,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const updateMedia = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Media> & { id: string }) => {
      const { error } = await supabase.from('media').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const deleteMedia = useMutation({
    mutationFn: async (media: Media) => {
      await supabase.storage.from('media').remove([media.file_path]);
      const { error } = await supabase.from('media').delete().eq('id', media.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  return { uploadMedia, updateMedia, deleteMedia };
};

// =====================================================
// THEME SETTINGS
// =====================================================
export const useThemeSettings = () => {
  return useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .order('category');
      if (error) throw error;
      return data as ThemeSetting[];
    },
  });
};

export const useThemeSettingMutations = () => {
  const queryClient = useQueryClient();

  const upsertThemeSetting = useMutation({
    mutationFn: async (setting: { setting_key: string; setting_value: string; setting_type?: string; category?: string }) => {
      const { data, error } = await supabase
        .from('theme_settings')
        .upsert([setting], { onConflict: 'setting_key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['theme-settings'] }),
  });

  return { upsertThemeSetting };
};

// =====================================================
// SITE SETTINGS
// =====================================================
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('category');
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

export const useSiteSettingMutations = () => {
  const queryClient = useQueryClient();

  const upsertSiteSetting = useMutation({
    mutationFn: async (setting: { setting_key: string; setting_value: string; setting_type?: string; category?: string }) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert([setting], { onConflict: 'setting_key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site-settings'] }),
  });

  return { upsertSiteSetting };
};
