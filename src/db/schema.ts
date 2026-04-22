import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// =====================================================
// ENUMS
// =====================================================

export const reservationStatusEnum = pgEnum('reservation_status', [
  'pending', 'confirmed', 'cancelled', 'completed',
]);

export const reservationTypeEnum = pgEnum('reservation_type', [
  'room', 'restaurant', 'service',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'sent', 'paid', 'overdue', 'cancelled',
]);

export const quoteStatusEnum = pgEnum('quote_status', [
  'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted',
]);

// =====================================================
// BETTER-AUTH TABLES
// =====================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// =====================================================
// CMS CONTENT
// =====================================================

export const cmsContent = pgTable('cms_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionKey: text('section_key').notNull(),
  locale: text('locale').notNull(),
  fieldKey: text('field_key').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('cms_content_unique').on(table.sectionKey, table.locale, table.fieldKey),
]);

// =====================================================
// RESTAURANT MENUS
// =====================================================

export const restaurantMenus = pgTable('restaurant_menus', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }),
  year: integer('year'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const restaurantMenuTranslations = pgTable('restaurant_menu_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  menuId: uuid('menu_id').notNull().references(() => restaurantMenus.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('menu_trans_unique').on(table.menuId, table.locale),
]);

// =====================================================
// MENU CATEGORIES
// =====================================================

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  menuId: uuid('menu_id').references(() => restaurantMenus.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const menuCategoryTranslations = pgTable('menu_category_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => menuCategories.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('cat_trans_unique').on(table.categoryId, table.locale),
]);

// =====================================================
// MENU ITEMS
// =====================================================

export const menuItems = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => menuCategories.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isVegetarian: boolean('is_vegetarian').notNull().default(false),
  isVegan: boolean('is_vegan').notNull().default(false),
  isGlutenFree: boolean('is_gluten_free').notNull().default(false),
  isSignature: boolean('is_signature').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('item_cat_slug_unique').on(table.categoryId, table.slug),
]);

export const menuItemTranslations = pgTable('menu_item_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('item_trans_unique').on(table.itemId, table.locale),
]);

// =====================================================
// SERVICES
// =====================================================

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_services_slug').on(table.slug),
]);

export const serviceTranslations = pgTable('service_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('svc_trans_unique').on(table.serviceId, table.locale),
]);

// =====================================================
// BLOG
// =====================================================

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  authorId: text('author_id').references(() => user.id),
  imageUrl: text('image_url'),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_blog_posts_slug').on(table.slug),
  index('idx_blog_posts_published').on(table.isPublished, table.publishedAt),
]);

export const blogPostTranslations = pgTable('blog_post_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
}, (table) => [
  uniqueIndex('post_trans_unique').on(table.postId, table.locale),
]);

// =====================================================
// COMMENTS
// =====================================================

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  content: text('content').notNull(),
  isApproved: boolean('is_approved').notNull().default(false),
  isRejected: boolean('is_rejected').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_comments_post').on(table.postId, table.isApproved),
]);

// =====================================================
// CLIENTS CRM
// =====================================================

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => user.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('France'),
  notes: text('notes'),
  tags: text('tags').array(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_clients_email').on(table.email),
]);

// =====================================================
// RESERVATIONS
// =====================================================

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id),
  type: reservationTypeEnum('type').notNull(),
  referenceId: uuid('reference_id'),
  status: reservationStatusEnum('status').notNull().default('pending'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  guestsCount: integer('guests_count').default(1),
  specialRequests: text('special_requests'),
  totalAmount: numeric('total_amount'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_reservations_status').on(table.status),
  index('idx_reservations_dates').on(table.startDate, table.endDate),
]);

// =====================================================
// INVOICES
// =====================================================

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: uuid('client_id').references(() => clients.id),
  reservationId: uuid('reservation_id').references(() => reservations.id),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  issueDate: date('issue_date').notNull().defaultNow(),
  dueDate: date('due_date').notNull(),
  subtotal: numeric('subtotal').notNull().default('0'),
  taxRate: numeric('tax_rate').notNull().default('20'),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  total: numeric('total').notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_invoices_status').on(table.status),
]);

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unitPrice: numeric('unit_price').notNull(),
  total: numeric('total').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// =====================================================
// QUOTES
// =====================================================

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteNumber: text('quote_number').notNull().unique(),
  clientId: uuid('client_id').references(() => clients.id),
  status: quoteStatusEnum('status').notNull().default('draft'),
  issueDate: date('issue_date').notNull().defaultNow(),
  validUntil: date('valid_until').notNull(),
  subtotal: numeric('subtotal').notNull().default('0'),
  taxRate: numeric('tax_rate').notNull().default('20'),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  total: numeric('total').notNull().default('0'),
  notes: text('notes'),
  convertedInvoiceId: uuid('converted_invoice_id').references(() => invoices.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_quotes_status').on(table.status),
]);

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unitPrice: numeric('unit_price').notNull(),
  total: numeric('total').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// =====================================================
// MEDIA
// =====================================================

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  filePath: text('file_path').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  altText: text('alt_text'),
  folder: text('folder').default('general'),
  uploadedBy: text('uploaded_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================
// THEME SETTINGS
// =====================================================

export const themeSettings = pgTable('theme_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  settingType: text('setting_type').notNull().default('color'),
  category: text('category').notNull().default('general'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================
// SITE SETTINGS
// =====================================================

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  settingType: text('setting_type').notNull().default('text'),
  category: text('category').notNull().default('general'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================
// ROOMS
// =====================================================

export const roomTypeEnum = pgEnum('room_type', [
  'single', 'double', 'twin', 'triple', 'quad', 'five', 'suite',
]);

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  roomType: roomTypeEnum('room_type').notNull(),
  capacity: integer('capacity').notNull().default(1),
  pricePerNight: numeric('price_per_night', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_rooms_slug').on(table.slug),
]);

export const roomTranslations = pgTable('room_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('room_trans_unique').on(table.roomId, table.locale),
]);

// =====================================================
// ROOM EXTRAS / PRICING OPTIONS
// =====================================================

export const roomExtras = pgTable('room_extras', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roomExtraTranslations = pgTable('room_extra_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  extraId: uuid('extra_id').notNull().references(() => roomExtras.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  label: text('label').notNull(),
}, (table) => [
  uniqueIndex('room_extra_trans_unique').on(table.extraId, table.locale),
]);

// =====================================================
// OPENINGS (SEASONAL PERIODS)
// =====================================================

export const seasonEnum = pgEnum('season', ['summer', 'winter']);

export const openings = pgTable('openings', {
  id: uuid('id').defaultRandom().primaryKey(),
  season: seasonEnum('season').notNull(),
  year: integer('year').notNull(),
  restaurantStartDate: date('restaurant_start_date').notNull(),
  restaurantEndDate: date('restaurant_end_date').notNull(),
  hotelStartDate: date('hotel_start_date').notNull(),
  hotelEndDate: date('hotel_end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('opening_season_year_unique').on(table.season, table.year),
]);

export const openingTranslations = pgTable('opening_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  openingId: uuid('opening_id').notNull().references(() => openings.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  restaurantLabel: text('restaurant_label').notNull(),
  restaurantDates: text('restaurant_dates').notNull(),
  hotelLabel: text('hotel_label').notNull(),
  hotelDates: text('hotel_dates').notNull(),
  closedDays: text('closed_days'),
}, (table) => [
  uniqueIndex('opening_trans_unique').on(table.openingId, table.locale),
]);

// =====================================================
// PARTNERS
// =====================================================

export const partners = pgTable('partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_partners_slug').on(table.slug),
]);

// =====================================================
// CONTACT MESSAGES
// =====================================================

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  locale: text('locale').notNull().default('fr'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_contact_messages_read').on(table.isRead),
]);

// =====================================================
// PAGES (CMS page management)
// =====================================================

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================
// PAGE SECTION LAYOUT
// =====================================================

export const pageSections = pgTable('page_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageSlug: text('page_slug').notNull().default('accueil'),
  sectionKey: text('section_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('page_sections_slug_key').on(table.pageSlug, table.sectionKey),
]);

// =====================================================
// GALLERY IMAGES (hotel, restaurant, room carousels)
// =====================================================
export const galleryImages = pgTable('gallery_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionKey: text('section_key').notNull(),
  entityId: uuid('entity_id'),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text'),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_gallery_section_entity').on(table.sectionKey, table.entityId),
]);

// =====================================================
// RESTAURANT PRICING ITEMS
// Replaces the CMS-key hack (pricing.dailySpecial, etc.)
// with a proper relational table that carries a real price
// column and full i18n support.
// =====================================================

export const restaurantPricingItems = pgTable('restaurant_pricing_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_rest_pricing_slug').on(table.slug),
]);

export const restaurantPricingTranslations = pgTable('restaurant_pricing_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => restaurantPricingItems.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('rest_pricing_trans_unique').on(table.itemId, table.locale),
]);
