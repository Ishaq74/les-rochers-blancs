import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { db } from '@/db';
import { eq, desc, asc, and, or, sql, count, ilike, inArray } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { DEFAULT_HOTEL_GALLERY, DEFAULT_RESTAURANT_GALLERY } from '@/lib/default-media';
import { invalidateSettingsCache } from '@/lib/settings';
import { findStoredUploadAbsolutePath, getUploadPublicUrl, getUploadsRoot } from '@/lib/uploads';

// =====================================================
// HELPERS
// =====================================================

function adminGuard(ctx: { locals: App.Locals }) {
  if (!ctx.locals.user || ctx.locals.user.role !== 'admin') {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
  }
}

const paginationInput = {
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
};

function paginate(page: number, limit: number) {
  return { offset: (page - 1) * limit, limit };
}

const localeField = z.enum(['fr', 'en', 'ar', 'zh']);

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const datetimeField = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+\-]\d{2}:\d{2})$/, 'Must be ISO 8601 datetime');
const emailField = z.string().trim().check(z.email({ message: 'Invalid email' }));
const uuidField = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid UUID');

const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
]);
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MEDIA_FOLDERS = ['general', 'rooms', 'restaurant', 'blog'] as const;
const mediaFolderField = z.enum(ALLOWED_MEDIA_FOLDERS);

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

const FILE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

const DEFAULT_SECTION_GALLERIES: Record<string, readonly string[]> = {
  hotel: DEFAULT_HOTEL_GALLERY,
  restaurant: DEFAULT_RESTAURANT_GALLERY,
};

async function ensureDefaultGalleryIfEmpty(sectionKey: string, entityId?: string) {
  // Only auto-bootstrap top-level hotel/restaurant galleries.
  if (entityId) return;

  const defaults = DEFAULT_SECTION_GALLERIES[sectionKey];
  if (!defaults || defaults.length === 0) return;

  const [existing] = await db
    .select({ value: count() })
    .from(schema.galleryImages)
    .where(eq(schema.galleryImages.sectionKey, sectionKey));

  if ((existing?.value ?? 0) > 0) return;

  await db.insert(schema.galleryImages).values(
    defaults.map((imageUrl, sortOrder) => ({
      sectionKey,
      imageUrl,
      altText: '',
      caption: '',
      sortOrder,
      isActive: true,
    }))
  );
}

// =====================================================
// ACTIONS
// =====================================================

export const server = {
  // -------------------------------------------------
  // CONTACT (public)
  // -------------------------------------------------
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2).max(200),
      email: emailField.max(300),
      message: z.string().min(10).max(5000),
      locale: localeField.default('fr'),
      _honey: z.string().max(0).default(''), // honeypot
    }),
    handler: async (input) => {
      if (input._honey) throw new ActionError({ code: 'BAD_REQUEST', message: 'Bot detected' });
      const [msg] = await db.insert(schema.contactMessages).values({
        name: input.name,
        email: input.email,
        message: input.message,
        locale: input.locale,
      }).returning({ id: schema.contactMessages.id });
      return { id: msg.id };
    },
  }),

  // -------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------
  getDashboardStats: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const [clientsCount] = await db.select({ value: count() }).from(schema.clients);
      const [reservationsCount] = await db.select({ value: count() }).from(schema.reservations).where(eq(schema.reservations.status, 'pending'));
      const [postsCount] = await db.select({ value: count() }).from(schema.blogPosts).where(eq(schema.blogPosts.isPublished, true));
      const [messagesCount] = await db.select({ value: count() }).from(schema.contactMessages).where(eq(schema.contactMessages.isRead, false));
      const [pendingCommentsCount] = await db.select({ value: count() }).from(schema.comments).where(and(eq(schema.comments.isApproved, false), eq(schema.comments.isRejected, false)));
      return {
        clients: clientsCount.value,
        pendingReservations: reservationsCount.value,
        publishedPosts: postsCount.value,
        unreadMessages: messagesCount.value,
        pendingComments: pendingCommentsCount.value,
      };
    },
  }),

  // -------------------------------------------------
  // CMS CONTENT
  // -------------------------------------------------
  listCmsContent: defineAction({
    input: z.object({ sectionKey: z.string().optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const conditions = input.sectionKey ? eq(schema.cmsContent.sectionKey, input.sectionKey) : undefined;
      return db.select().from(schema.cmsContent).where(conditions).orderBy(asc(schema.cmsContent.sectionKey), asc(schema.cmsContent.locale));
    },
  }),

  upsertCmsContent: defineAction({
    input: z.object({
      sectionKey: z.string().min(1),
      locale: localeField,
      fieldKey: z.string().min(1),
      content: z.string(),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const [row] = await db.insert(schema.cmsContent).values(input).onConflictDoUpdate({
        target: [schema.cmsContent.sectionKey, schema.cmsContent.locale, schema.cmsContent.fieldKey],
        set: {
          content: input.content,
          updatedAt: new Date(),
        },
      }).returning({ id: schema.cmsContent.id });
      invalidateSettingsCache();
      return row.id;
    },
  }),

  deleteCmsContent: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.cmsContent).where(eq(schema.cmsContent.id, input.id));
      invalidateSettingsCache();
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // ROOMS

    // -------------------------------------------------
    // BULK CMS UPSERT — saves all fields for a section at once
    // Used by the dedicated Hotel / Restaurant admin panels
    // -------------------------------------------------
    bulkUpsertCms: defineAction({
      input: z.object({
        sectionKey: z.string().min(1),
        locale: localeField,
        fields: z.array(z.object({
          fieldKey: z.string().min(1),
          content: z.string(),
        })),
      }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        await Promise.all(
          input.fields.map(f =>
            db.insert(schema.cmsContent).values({
              sectionKey: input.sectionKey,
              locale: input.locale,
              fieldKey: f.fieldKey,
              content: f.content,
            }).onConflictDoUpdate({
              target: [schema.cmsContent.sectionKey, schema.cmsContent.locale, schema.cmsContent.fieldKey],
              set: { content: f.content, updatedAt: new Date() },
            })
          )
        );
        invalidateSettingsCache();
        return { success: true };
      },
    }),

    // -------------------------------------------------
    // GALLERY IMAGES
    // -------------------------------------------------
    listGallery: defineAction({
      input: z.object({
        sectionKey: z.string().min(1),
        entityId: uuidField.optional(),
      }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        await ensureDefaultGalleryIfEmpty(input.sectionKey, input.entityId);
        const conditions = input.entityId
          ? and(eq(schema.galleryImages.sectionKey, input.sectionKey), eq(schema.galleryImages.entityId, input.entityId))
          : eq(schema.galleryImages.sectionKey, input.sectionKey);
        return db.select().from(schema.galleryImages).where(conditions).orderBy(asc(schema.galleryImages.sortOrder));
      },
    }),

    saveGalleryImage: defineAction({
      input: z.object({
        id: uuidField.optional(),
        sectionKey: z.string().min(1),
        entityId: uuidField.optional(),
        imageUrl: z.string().min(1),
        altText: z.string().optional(),
        caption: z.string().optional(),
        sortOrder: z.number().int().default(0),
        isActive: z.boolean().default(true),
      }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        const { id, ...data } = input;
        if (id) {
          await db.update(schema.galleryImages).set({ ...data, updatedAt: new Date() }).where(eq(schema.galleryImages.id, id));
          return { id };
        }
        const [row] = await db.insert(schema.galleryImages).values(data).returning({ id: schema.galleryImages.id });
        return row;
      },
    }),

    deleteGalleryImage: defineAction({
      input: z.object({ id: uuidField }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        await db.delete(schema.galleryImages).where(eq(schema.galleryImages.id, input.id));
        return { success: true };
      },
    }),

    // -------------------------------------------------
    // RESTAURANT PRICING ITEMS
    // -------------------------------------------------
    listRestaurantPricingItems: defineAction({
      handler: async (_input, ctx) => {
        adminGuard(ctx);
        const rows = await db.select().from(schema.restaurantPricingItems).orderBy(asc(schema.restaurantPricingItems.sortOrder));
        const translations = await db.select().from(schema.restaurantPricingTranslations);
        return rows.map(r => ({
          ...r,
          translations: translations.filter(t => t.itemId === r.id),
        }));
      },
    }),

    saveRestaurantPricingItem: defineAction({
      input: z.object({
        id: uuidField.optional(),
        slug: z.string().min(1),
        price: z.string().nullable().optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        translations: z.array(z.object({
          locale: localeField,
          name: z.string().min(1),
          description: z.string().optional(),
        })),
      }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        const { id, translations, ...data } = input;
        return db.transaction(async (tx) => {
          let itemId: string;
          if (id) {
            await tx.update(schema.restaurantPricingItems).set({ ...data, updatedAt: new Date() }).where(eq(schema.restaurantPricingItems.id, id));
            itemId = id;
            await tx.delete(schema.restaurantPricingTranslations).where(eq(schema.restaurantPricingTranslations.itemId, id));
          } else {
            const [row] = await tx.insert(schema.restaurantPricingItems).values(data).returning({ id: schema.restaurantPricingItems.id });
            itemId = row.id;
          }
          if (translations.length > 0) {
            await tx.insert(schema.restaurantPricingTranslations).values(translations.map(t => ({ ...t, itemId })));
          }
          return { id: itemId };
        });
      },
    }),

    deleteRestaurantPricingItem: defineAction({
      input: z.object({ id: uuidField }),
      handler: async (input, ctx) => {
        adminGuard(ctx);
        await db.delete(schema.restaurantPricingItems).where(eq(schema.restaurantPricingItems.id, input.id));
        return { success: true };
      },
    }),

    // -------------------------------------------------
    // ROOMS
  // -------------------------------------------------
  listRooms: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const rows = await db.select().from(schema.rooms).orderBy(asc(schema.rooms.sortOrder));
      const translations = await db.select().from(schema.roomTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.roomId === r.id),
      }));
    },
  }),

  saveRoom: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      roomType: z.enum(['single', 'double', 'twin', 'triple', 'quad', 'five', 'suite']),
      capacity: z.number().int().positive(),
      pricePerNight: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price (e.g. 120 or 120.50)'),
      imageUrl: z.string().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        name: z.string().min(1),
        description: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;
      return db.transaction(async (tx) => {
        let roomId: string;

        if (id) {
          await tx.update(schema.rooms).set({ ...data, updatedAt: new Date() }).where(eq(schema.rooms.id, id));
          roomId = id;
          await tx.delete(schema.roomTranslations).where(eq(schema.roomTranslations.roomId, id));
        } else {
          const [row] = await tx.insert(schema.rooms).values(data).returning({ id: schema.rooms.id });
          roomId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.roomTranslations).values(
            translations.map(t => ({ ...t, roomId }))
          );
        }

        return { id: roomId };
      });
    },
  }),

  deleteRoom: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.rooms).where(eq(schema.rooms.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // ROOM EXTRAS
  // -------------------------------------------------
  listRoomExtras: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const rows = await db.select().from(schema.roomExtras).orderBy(asc(schema.roomExtras.sortOrder));
      const translations = await db.select().from(schema.roomExtraTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.extraId === r.id),
      }));
    },
  }),

  saveRoomExtra: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      price: z.string().nullable().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        label: z.string().min(1),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      return db.transaction(async (tx) => {
        let extraId: string;

        if (id) {
          await tx.update(schema.roomExtras).set({ ...data, updatedAt: new Date() }).where(eq(schema.roomExtras.id, id));
          extraId = id;
          await tx.delete(schema.roomExtraTranslations).where(eq(schema.roomExtraTranslations.extraId, id));
        } else {
          const [row] = await tx.insert(schema.roomExtras).values(data).returning({ id: schema.roomExtras.id });
          extraId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.roomExtraTranslations).values(
            translations.map(t => ({ ...t, extraId }))
          );
        }
        return { id: extraId };
      });
    },
  }),

  deleteRoomExtra: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.roomExtras).where(eq(schema.roomExtras.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // OPENINGS
  // -------------------------------------------------
  listOpenings: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const rows = await db.select().from(schema.openings).orderBy(desc(schema.openings.year), asc(schema.openings.sortOrder));
      const translations = await db.select().from(schema.openingTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.openingId === r.id),
      }));
    },
  }),

  saveOpening: defineAction({
    input: z.object({
      id: uuidField.optional(),
      season: z.enum(['summer', 'winter']),
      year: z.number().int(),
      restaurantStartDate: dateField,
      restaurantEndDate: dateField,
      hotelStartDate: dateField,
      hotelEndDate: dateField,
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        title: z.string().min(1),
        restaurantLabel: z.string(),
        restaurantDates: z.string(),
        hotelLabel: z.string(),
        hotelDates: z.string(),
        closedDays: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      return db.transaction(async (tx) => {
        let openingId: string;

        if (id) {
          await tx.update(schema.openings).set({ ...data, updatedAt: new Date() }).where(eq(schema.openings.id, id));
          openingId = id;
          await tx.delete(schema.openingTranslations).where(eq(schema.openingTranslations.openingId, id));
        } else {
          const [row] = await tx.insert(schema.openings).values(data).returning({ id: schema.openings.id });
          openingId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.openingTranslations).values(
            translations.map(t => ({ ...t, openingId }))
          );
        }
        return { id: openingId };
      });
    },
  }),

  deleteOpening: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.openings).where(eq(schema.openings.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // SERVICES
  // -------------------------------------------------
  listServices: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const rows = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder));
      const translations = await db.select().from(schema.serviceTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.serviceId === r.id),
      }));
    },
  }),

  saveService: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      icon: z.string().optional(),
      imageUrl: z.string().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        name: z.string().min(1),
        description: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      return db.transaction(async (tx) => {
        let serviceId: string;

        if (id) {
          await tx.update(schema.services).set({ ...data, updatedAt: new Date() }).where(eq(schema.services.id, id));
          serviceId = id;
          await tx.delete(schema.serviceTranslations).where(eq(schema.serviceTranslations.serviceId, id));
        } else {
          const [row] = await tx.insert(schema.services).values(data).returning({ id: schema.services.id });
          serviceId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.serviceTranslations).values(
            translations.map(t => ({ ...t, serviceId }))
          );
        }
        return { id: serviceId };
      });
    },
  }),

  deleteService: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.services).where(eq(schema.services.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // PARTNERS
  // -------------------------------------------------
  listPartners: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.partners).orderBy(asc(schema.partners.sortOrder));
    },
  }),

  savePartner: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      name: z.string().min(1),
      websiteUrl: z.string().optional(),
      logoUrl: z.string().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { id, ...data } = input;
      if (id) {
        await db.update(schema.partners).set({ ...data, updatedAt: new Date() }).where(eq(schema.partners.id, id));
        return { id };
      }
      const [row] = await db.insert(schema.partners).values(data).returning({ id: schema.partners.id });
      return { id: row.id };
    },
  }),

  deletePartner: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.partners).where(eq(schema.partners.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // RESTAURANT MENUS
  // -------------------------------------------------
  listMenus: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      const rows = await db.select().from(schema.restaurantMenus).orderBy(asc(schema.restaurantMenus.sortOrder));
      const translations = await db.select().from(schema.restaurantMenuTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.menuId === r.id),
      }));
    },
  }),

  saveMenu: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      price: z.string().nullable().optional(),
      year: z.number().int().nullable().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      imageUrl: z.string().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        name: z.string().min(1),
        description: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;
      return db.transaction(async (tx) => {
        let menuId: string;

        if (id) {
          await tx.update(schema.restaurantMenus).set({ ...data, updatedAt: new Date() }).where(eq(schema.restaurantMenus.id, id));
          menuId = id;
          await tx.delete(schema.restaurantMenuTranslations).where(eq(schema.restaurantMenuTranslations.menuId, id));
        } else {
          const [row] = await tx.insert(schema.restaurantMenus).values(data).returning({ id: schema.restaurantMenus.id });
          menuId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.restaurantMenuTranslations).values(
            translations.map(t => ({ ...t, menuId }))
          );
        }

        return { id: menuId };
      });
    },
  }),

  deleteMenu: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.restaurantMenus).where(eq(schema.restaurantMenus.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // MENU CATEGORIES
  // -------------------------------------------------
  listMenuCategories: defineAction({
    input: z.object({ menuId: uuidField.optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const conditions = input.menuId ? eq(schema.menuCategories.menuId, input.menuId) : undefined;
      const rows = await db.select().from(schema.menuCategories).where(conditions).orderBy(asc(schema.menuCategories.sortOrder));
      const translations = await db.select().from(schema.menuCategoryTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.categoryId === r.id),
      }));
    },
  }),

  saveMenuCategory: defineAction({
    input: z.object({
      id: uuidField.optional(),
      menuId: uuidField.nullable().optional(),
      slug: z.string().min(1),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
      translations: z.array(z.object({
        locale: localeField,
        name: z.string().min(1),
        description: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      return db.transaction(async (tx) => {
        let categoryId: string;

        if (id) {
          await tx.update(schema.menuCategories).set({ ...data, updatedAt: new Date() }).where(eq(schema.menuCategories.id, id));
          categoryId = id;
          await tx.delete(schema.menuCategoryTranslations).where(eq(schema.menuCategoryTranslations.categoryId, id));
        } else {
          const [row] = await tx.insert(schema.menuCategories).values(data).returning({ id: schema.menuCategories.id });
          categoryId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.menuCategoryTranslations).values(
            translations.map(t => ({ ...t, categoryId }))
          );
        }
        return { id: categoryId };
      });
    },
  }),

  deleteMenuCategory: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.menuCategories).where(eq(schema.menuCategories.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // MENU ITEMS
  // -------------------------------------------------
  listMenuItems: defineAction({
    input: z.object({ categoryId: uuidField.optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const conditions = input.categoryId ? eq(schema.menuItems.categoryId, input.categoryId) : undefined;
      const rows = await db.select().from(schema.menuItems).where(conditions).orderBy(asc(schema.menuItems.sortOrder));
      const translations = await db.select().from(schema.menuItemTranslations);
      return rows.map(r => ({
        ...r,
        translations: translations.filter(t => t.itemId === r.id),
      }));
    },
  }),

  saveMenuItem: defineAction({
    input: z.object({
      id: uuidField.optional(),
      categoryId: uuidField,
      slug: z.string().min(1),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price (e.g. 12 or 12.50)'),
      imageUrl: z.string().optional(),
      isVegetarian: z.boolean().default(false),
      isVegan: z.boolean().default(false),
      isGlutenFree: z.boolean().default(false),
      isSignature: z.boolean().default(false),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      translations: z.array(z.object({
        locale: localeField,
        name: z.string().min(1),
        description: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      return db.transaction(async (tx) => {
        let itemId: string;

        if (id) {
          await tx.update(schema.menuItems).set({ ...data, updatedAt: new Date() }).where(eq(schema.menuItems.id, id));
          itemId = id;
          await tx.delete(schema.menuItemTranslations).where(eq(schema.menuItemTranslations.itemId, id));
        } else {
          const [row] = await tx.insert(schema.menuItems).values(data).returning({ id: schema.menuItems.id });
          itemId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.menuItemTranslations).values(
            translations.map(t => ({ ...t, itemId }))
          );
        }
        return { id: itemId };
      });
    },
  }),

  deleteMenuItem: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // BLOG POSTS
  // -------------------------------------------------
  listBlogPosts: defineAction({
    input: z.object({ ...paginationInput, publishedOnly: z.boolean().default(false), search: z.string().optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const escapedSearch = input.search ? escapeLikePattern(input.search.trim()) : undefined;

      const publishedCond = input.publishedOnly ? eq(schema.blogPosts.isPublished, true) : undefined;
      const slugSearchCond = escapedSearch ? ilike(schema.blogPosts.slug, `%${escapedSearch}%`) : undefined;

      // When searching, also check blog post translations titles via subquery approach
      let postIdsFromTranslations: string[] = [];
      if (escapedSearch) {
        const titleMatches = await db.select({ postId: schema.blogPostTranslations.postId })
          .from(schema.blogPostTranslations)
          .where(ilike(schema.blogPostTranslations.title, `%${escapedSearch}%`));
        postIdsFromTranslations = titleMatches.map(r => r.postId);
      }

      const buildConditions = (includeSearch: boolean) => {
        if (!includeSearch) return publishedCond;
        const searchTermConds = escapedSearch
          ? (postIdsFromTranslations.length > 0
            ? or(slugSearchCond, inArray(schema.blogPosts.id, postIdsFromTranslations))
            : slugSearchCond)
          : undefined;
        return publishedCond && searchTermConds ? and(publishedCond, searchTermConds) : publishedCond ?? searchTermConds;
      };

      const conditions = buildConditions(true);
      const rows = await db.select().from(schema.blogPosts).where(conditions)
        .orderBy(desc(schema.blogPosts.createdAt)).limit(limit).offset(offset);
      const allTranslations = await db.select().from(schema.blogPostTranslations);
      const [total] = await db.select({ value: count() }).from(schema.blogPosts).where(conditions);
      return {
        items: rows.map(r => ({
          ...r,
          translations: allTranslations.filter(t => t.postId === r.id),
        })),
        total: total.value,
        page: input.page,
        totalPages: Math.ceil(total.value / input.limit),
      };
    },
  }),

  saveBlogPost: defineAction({
    input: z.object({
      id: uuidField.optional(),
      slug: z.string().min(1),
      imageUrl: z.string().optional(),
      isPublished: z.boolean().default(false),
      translations: z.array(z.object({
        locale: localeField,
        title: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { translations, id, ...data } = input;

      // Set publishedAt when publishing for the first time
      const publishData = {
        ...data,
        authorId: ctx.locals.user!.id,
        ...(data.isPublished && !id ? { publishedAt: new Date() } : {}),
      };

      return db.transaction(async (tx) => {
        let postId: string;

        if (id) {
          // If transitioning to published, set publishedAt
          const existing = await tx.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id));
          if (existing.length && !existing[0].isPublished && data.isPublished) {
            Object.assign(publishData, { publishedAt: new Date() });
          }
          await tx.update(schema.blogPosts).set({ ...publishData, updatedAt: new Date() }).where(eq(schema.blogPosts.id, id));
          postId = id;
          await tx.delete(schema.blogPostTranslations).where(eq(schema.blogPostTranslations.postId, id));
        } else {
          const [row] = await tx.insert(schema.blogPosts).values(publishData).returning({ id: schema.blogPosts.id });
          postId = row.id;
        }

        if (translations.length > 0) {
          await tx.insert(schema.blogPostTranslations).values(
            translations.map(t => ({ ...t, postId }))
          );
        }

        return { id: postId };
      });
    },
  }),

  deleteBlogPost: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // COMMENTS
  // -------------------------------------------------
  listComments: defineAction({
    input: z.object({
      ...paginationInput,
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      search: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);

      const statusCond = input.status === 'pending'
        ? and(eq(schema.comments.isApproved, false), eq(schema.comments.isRejected, false))
        : input.status === 'approved'
          ? eq(schema.comments.isApproved, true)
          : input.status === 'rejected'
            ? eq(schema.comments.isRejected, true)
            : undefined;

      const searchCond = input.search
        ? or(
            ilike(schema.comments.authorName, `%${input.search}%`),
            ilike(schema.comments.authorEmail, `%${input.search}%`),
            ilike(schema.comments.content, `%${input.search}%`),
          )
        : undefined;

      const conditions = statusCond && searchCond ? and(statusCond, searchCond) : statusCond ?? searchCond;

      const rows = await db.select({
        id: schema.comments.id,
        postId: schema.comments.postId,
        authorName: schema.comments.authorName,
        authorEmail: schema.comments.authorEmail,
        content: schema.comments.content,
        isApproved: schema.comments.isApproved,
        isRejected: schema.comments.isRejected,
        createdAt: schema.comments.createdAt,
        postSlug: schema.blogPosts.slug,
      })
        .from(schema.comments)
        .leftJoin(schema.blogPosts, eq(schema.comments.postId, schema.blogPosts.id))
        .where(conditions)
        .orderBy(desc(schema.comments.createdAt))
        .limit(limit)
        .offset(offset);

      const [total] = await db.select({ value: count() }).from(schema.comments).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  approveComment: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.update(schema.comments)
        .set({ isApproved: true, isRejected: false })
        .where(eq(schema.comments.id, input.id));
      return { success: true };
    },
  }),

  rejectComment: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.update(schema.comments)
        .set({ isRejected: true, isApproved: false })
        .where(eq(schema.comments.id, input.id));
      return { success: true };
    },
  }),

  deleteComment: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.comments).where(eq(schema.comments.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // CLIENTS CRM
  // -------------------------------------------------
  listClients: defineAction({
    input: z.object({ ...paginationInput, search: z.string().optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const searchCondition = input.search
        ? or(
            ilike(schema.clients.firstName, `%${escapeLikePattern(input.search)}%`),
            ilike(schema.clients.lastName, `%${escapeLikePattern(input.search)}%`),
            ilike(schema.clients.email, `%${escapeLikePattern(input.search)}%`),
          )
        : undefined;
      const rows = await db.select().from(schema.clients).where(searchCondition)
        .orderBy(desc(schema.clients.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.clients).where(searchCondition);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  saveClient: defineAction({
    input: z.object({
      id: uuidField.optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: emailField,
      phone: z.string().optional(),
      company: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default('France'),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().default(true),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { id, ...data } = input;
      if (id) {
        await db.update(schema.clients).set({ ...data, updatedAt: new Date() }).where(eq(schema.clients.id, id));
        return { id };
      }
      const [row] = await db.insert(schema.clients).values(data).returning({ id: schema.clients.id });
      return { id: row.id };
    },
  }),

  deleteClient: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.clients).where(eq(schema.clients.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // RESERVATIONS
  // -------------------------------------------------
  listReservations: defineAction({
    input: z.object({ ...paginationInput, status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const conditions = input.status ? eq(schema.reservations.status, input.status) : undefined;
      const rows = await db.select().from(schema.reservations).where(conditions)
        .orderBy(desc(schema.reservations.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.reservations).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  saveReservation: defineAction({
    input: z.object({
      id: uuidField.optional(),
      clientId: uuidField.nullable().optional(),
      type: z.enum(['room', 'restaurant', 'service']),
      referenceId: uuidField.nullable().optional(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
      startDate: datetimeField,
      endDate: datetimeField.nullable().optional(),
      guestsCount: z.number().int().positive().default(1),
      specialRequests: z.string().optional(),
      totalAmount: z.string().nullable().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { id, startDate, endDate, ...rest } = input;
      const data = { ...rest, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null };
      if (id) {
        await db.update(schema.reservations).set({ ...data, updatedAt: new Date() }).where(eq(schema.reservations.id, id));
        return { id };
      }
      const [row] = await db.insert(schema.reservations).values(data).returning({ id: schema.reservations.id });
      return { id: row.id };
    },
  }),

  deleteReservation: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.reservations).where(eq(schema.reservations.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // INVOICES
  // -------------------------------------------------
  listInvoices: defineAction({
    input: z.object({ ...paginationInput, status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const conditions = input.status ? eq(schema.invoices.status, input.status) : undefined;
      const rows = await db.select().from(schema.invoices).where(conditions)
        .orderBy(desc(schema.invoices.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.invoices).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  saveInvoice: defineAction({
    input: z.object({
      id: uuidField.optional(),
      invoiceNumber: z.string().min(1),
      clientId: uuidField.nullable().optional(),
      reservationId: uuidField.nullable().optional(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
      issueDate: dateField,
      dueDate: dateField,
      subtotal: z.string().default('0'),
      taxRate: z.string().default('20'),
      taxAmount: z.string().default('0'),
      total: z.string().default('0'),
      notes: z.string().optional(),
      items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.string().default('1'),
        unitPrice: z.string(),
        total: z.string(),
        sortOrder: z.number().int().default(0),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { items, id, ...data } = input;
      return db.transaction(async (tx) => {
        let invoiceId: string;

        if (id) {
          await tx.update(schema.invoices).set({ ...data, updatedAt: new Date() }).where(eq(schema.invoices.id, id));
          invoiceId = id;
          await tx.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id));
        } else {
          const [row] = await tx.insert(schema.invoices).values(data).returning({ id: schema.invoices.id });
          invoiceId = row.id;
        }

        if (items.length > 0) {
          await tx.insert(schema.invoiceItems).values(
            items.map(item => ({ ...item, invoiceId }))
          );
        }

        return { id: invoiceId };
      });
    },
  }),

  deleteInvoice: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.invoices).where(eq(schema.invoices.id, input.id));
      return { success: true };
    },
  }),

  listInvoiceItems: defineAction({
    input: z.object({ invoiceId: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, input.invoiceId)).orderBy(schema.invoiceItems.sortOrder);
    },
  }),

  // -------------------------------------------------
  // QUOTES
  // -------------------------------------------------
  listQuotes: defineAction({
    input: z.object({ ...paginationInput, status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const conditions = input.status ? eq(schema.quotes.status, input.status) : undefined;
      const rows = await db.select().from(schema.quotes).where(conditions)
        .orderBy(desc(schema.quotes.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.quotes).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  saveQuote: defineAction({
    input: z.object({
      id: uuidField.optional(),
      quoteNumber: z.string().min(1),
      clientId: uuidField.nullable().optional(),
      status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).default('draft'),
      issueDate: dateField,
      validUntil: dateField,
      subtotal: z.string().default('0'),
      taxRate: z.string().default('20'),
      taxAmount: z.string().default('0'),
      total: z.string().default('0'),
      notes: z.string().optional(),
      items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.string().default('1'),
        unitPrice: z.string(),
        total: z.string(),
        sortOrder: z.number().int().default(0),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { items, id, ...data } = input;
      return db.transaction(async (tx) => {
        let quoteId: string;

        if (id) {
          await tx.update(schema.quotes).set({ ...data, updatedAt: new Date() }).where(eq(schema.quotes.id, id));
          quoteId = id;
          await tx.delete(schema.quoteItems).where(eq(schema.quoteItems.quoteId, id));
        } else {
          const [row] = await tx.insert(schema.quotes).values(data).returning({ id: schema.quotes.id });
          quoteId = row.id;
        }

        if (items.length > 0) {
          await tx.insert(schema.quoteItems).values(
            items.map(item => ({ ...item, quoteId }))
          );
        }

        return { id: quoteId };
      });
    },
  }),

  deleteQuote: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.quotes).where(eq(schema.quotes.id, input.id));
      return { success: true };
    },
  }),

  listQuoteItems: defineAction({
    input: z.object({ quoteId: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.quoteItems).where(eq(schema.quoteItems.quoteId, input.quoteId)).orderBy(schema.quoteItems.sortOrder);
    },
  }),

  convertQuoteToInvoice: defineAction({
    input: z.object({
      quoteId: uuidField,
      invoiceNumber: z.string().min(1),
      dueDate: dateField,
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      return db.transaction(async (tx) => {
        const [quote] = await tx.select().from(schema.quotes).where(eq(schema.quotes.id, input.quoteId));
        if (!quote) throw new ActionError({ code: 'NOT_FOUND', message: 'Quote not found' });
        if (quote.convertedInvoiceId) throw new ActionError({ code: 'CONFLICT', message: 'Quote already converted' });

        const quoteItemRows = await tx.select().from(schema.quoteItems).where(eq(schema.quoteItems.quoteId, quote.id));

        const [invoice] = await tx.insert(schema.invoices).values({
          invoiceNumber: input.invoiceNumber,
          clientId: quote.clientId,
          status: 'draft',
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: input.dueDate,
          subtotal: quote.subtotal,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes,
        }).returning({ id: schema.invoices.id });

        if (quoteItemRows.length > 0) {
          await tx.insert(schema.invoiceItems).values(
            quoteItemRows.map(item => ({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sortOrder: item.sortOrder,
            }))
          );
        }

        const updated = await tx.update(schema.quotes).set({
          status: 'converted',
          convertedInvoiceId: invoice.id,
          updatedAt: new Date(),
        }).where(
          and(eq(schema.quotes.id, quote.id), sql`${schema.quotes.convertedInvoiceId} is null`)
        ).returning({ id: schema.quotes.id });

        if (updated.length === 0) {
          throw new ActionError({ code: 'CONFLICT', message: 'Quote already converted' });
        }

        return { invoiceId: invoice.id };
      });
    },
  }),

  // -------------------------------------------------
  // CONTACT MESSAGES (admin)
  // -------------------------------------------------
  listContactMessages: defineAction({
    input: z.object({ ...paginationInput, unreadOnly: z.boolean().default(false), search: z.string().optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const unreadCond = input.unreadOnly ? eq(schema.contactMessages.isRead, false) : undefined;
      const searchCond = input.search
        ? or(
            ilike(schema.contactMessages.name, `%${input.search}%`),
            ilike(schema.contactMessages.email, `%${input.search}%`),
            ilike(schema.contactMessages.message, `%${input.search}%`),
          )
        : undefined;
      const conditions = unreadCond && searchCond ? and(unreadCond, searchCond) : unreadCond ?? searchCond;
      const rows = await db.select().from(schema.contactMessages).where(conditions)
        .orderBy(desc(schema.contactMessages.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.contactMessages).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  markMessageRead: defineAction({
    input: z.object({ id: uuidField, isRead: z.boolean().default(true) }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.update(schema.contactMessages).set({ isRead: input.isRead }).where(eq(schema.contactMessages.id, input.id));
      return { success: true };
    },
  }),

  deleteContactMessage: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, input.id));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // MEDIA
  // -------------------------------------------------
  listMedia: defineAction({
    input: z.object({ ...paginationInput, folder: mediaFolderField.optional() }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { offset, limit } = paginate(input.page, input.limit);
      const conditions = input.folder ? eq(schema.media.folder, input.folder) : undefined;
      const rows = await db.select().from(schema.media).where(conditions)
        .orderBy(desc(schema.media.createdAt)).limit(limit).offset(offset);
      const [total] = await db.select({ value: count() }).from(schema.media).where(conditions);
      return { items: rows, total: total.value, page: input.page, totalPages: Math.ceil(total.value / input.limit) };
    },
  }),

  uploadMedia: defineAction({
    accept: 'form',
    input: z.object({
      file: z.instanceof(File),
      altText: z.string().optional(),
      folder: mediaFolderField.default('general'),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const { file, altText, folder } = input;

      if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `File type "${file.type}" is not allowed. Allowed: ${[...ALLOWED_UPLOAD_TYPES].join(', ')}` });
      }
      if (file.size > MAX_UPLOAD_SIZE) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = FILE_EXTENSION_BY_MIME[file.type] ?? 'bin';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${folder}/${filename}`;

      // Write file to disk
      const { mkdir, writeFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const dir = join(getUploadsRoot(), folder);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, filename), buffer);

      const [row] = await db.insert(schema.media).values({
        filename,
        originalFilename: file.name,
        filePath,
        fileUrl: getUploadPublicUrl(filePath),
        fileType: file.type,
        fileSize: file.size,
        altText: altText || null,
        folder,
        uploadedBy: ctx.locals.user!.id,
      }).returning({ id: schema.media.id, fileUrl: schema.media.fileUrl });

      return row;
    },
  }),

  deleteMedia: defineAction({
    input: z.object({ id: uuidField }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const [item] = await db.select().from(schema.media).where(eq(schema.media.id, input.id));
      if (item) {
        // Delete DB first, then attempt FS cleanup
        await db.delete(schema.media).where(eq(schema.media.id, input.id));
        const { unlink } = await import('node:fs/promises');
        try {
          const filePath = await findStoredUploadAbsolutePath(item.filePath);
          if (filePath) {
            await unlink(filePath);
          }
        } catch (err) {
          console.warn(`[deleteMedia] Failed to remove file ${item.filePath}:`, err);
        }
      }
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // SITE SETTINGS
  // -------------------------------------------------
  listSiteSettings: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.siteSettings).orderBy(asc(schema.siteSettings.category));
    },
  }),

  saveSiteSetting: defineAction({
    input: z.object({
      settingKey: z.string().min(1),
      settingValue: z.string(),
      settingType: z.string().default('text'),
      category: z.string().default('general'),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const [row] = await db.insert(schema.siteSettings).values(input).onConflictDoUpdate({
        target: schema.siteSettings.settingKey,
        set: {
          settingValue: input.settingValue,
          settingType: input.settingType,
          category: input.category,
          updatedAt: new Date(),
        },
      }).returning({ id: schema.siteSettings.id });
      invalidateSettingsCache();
      return { id: row.id };
    },
  }),

  // -------------------------------------------------
  // THEME SETTINGS
  // -------------------------------------------------
  listThemeSettings: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.themeSettings).orderBy(asc(schema.themeSettings.category));
    },
  }),

  saveThemeSetting: defineAction({
    input: z.object({
      settingKey: z.string().min(1),
      settingValue: z.string(),
      settingType: z.string().default('color'),
      category: z.string().default('general'),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const [row] = await db.insert(schema.themeSettings).values(input).onConflictDoUpdate({
        target: schema.themeSettings.settingKey,
        set: {
          settingValue: input.settingValue,
          settingType: input.settingType,
          category: input.category,
          updatedAt: new Date(),
        },
      }).returning({ id: schema.themeSettings.id });
      invalidateSettingsCache();
      return { id: row.id };
    },
  }),

  // -------------------------------------------------
  // PUBLIC BLOG
  // -------------------------------------------------
  getPublicBlogPosts: defineAction({
    input: z.object({ locale: localeField, ...paginationInput }),
    handler: async (input) => {
      const { offset, limit } = paginate(input.page, input.limit);
      const rows = await db.select().from(schema.blogPosts)
        .where(eq(schema.blogPosts.isPublished, true))
        .orderBy(desc(schema.blogPosts.publishedAt))
        .limit(limit).offset(offset);
      const translations = await db.select().from(schema.blogPostTranslations)
        .where(eq(schema.blogPostTranslations.locale, input.locale));
      const [total] = await db.select({ value: count() }).from(schema.blogPosts).where(eq(schema.blogPosts.isPublished, true));
      return {
        items: rows.map(r => {
          const trans = translations.find(t => t.postId === r.id);
          return { ...r, title: trans?.title ?? '', excerpt: trans?.excerpt ?? '', content: trans?.content ?? '' };
        }),
        total: total.value,
        page: input.page,
        totalPages: Math.ceil(total.value / input.limit),
      };
    },
  }),

  getPublicBlogPost: defineAction({
    input: z.object({ slug: z.string(), locale: localeField }),
    handler: async (input) => {
      const [post] = await db.select().from(schema.blogPosts)
        .where(and(eq(schema.blogPosts.slug, input.slug), eq(schema.blogPosts.isPublished, true)));
      if (!post) throw new ActionError({ code: 'NOT_FOUND', message: 'Post not found' });

      // Increment view count
      await db.update(schema.blogPosts).set({ viewsCount: sql`${schema.blogPosts.viewsCount} + 1` }).where(eq(schema.blogPosts.id, post.id));

      const [trans] = await db.select().from(schema.blogPostTranslations)
        .where(and(eq(schema.blogPostTranslations.postId, post.id), eq(schema.blogPostTranslations.locale, input.locale)));

      return {
        ...post,
        title: trans?.title ?? '',
        excerpt: trans?.excerpt ?? '',
        content: trans?.content ?? '',
        metaTitle: trans?.metaTitle ?? '',
        metaDescription: trans?.metaDescription ?? '',
      };
    },
  }),

  // -------------------------------------------------
  // PAGES (CMS page management)
  // -------------------------------------------------
  listPages: defineAction({
    handler: async (_input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.pages).orderBy(asc(schema.pages.sortOrder));
    },
  }),

  savePage: defineAction({
    input: z.object({
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
      title: z.string().min(1).max(200),
      isSystem: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      const [row] = await db.insert(schema.pages).values({
        slug: input.slug,
        title: input.title,
        isSystem: input.isSystem,
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: schema.pages.slug,
        set: {
          title: input.title,
          sortOrder: input.sortOrder,
          updatedAt: new Date(),
        },
      }).returning();
      return row;
    },
  }),

  deletePage: defineAction({
    input: z.object({ slug: z.string().min(1) }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      // Prevent deleting system pages
      const [page] = await db.select().from(schema.pages).where(eq(schema.pages.slug, input.slug));
      if (page?.isSystem) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Cannot delete system page' });
      }
      // Delete associated sections
      await db.delete(schema.pageSections).where(eq(schema.pageSections.pageSlug, input.slug));
      await db.delete(schema.pages).where(eq(schema.pages.slug, input.slug));
      return { success: true };
    },
  }),

  // -------------------------------------------------
  // PAGE SECTIONS (ordering & visibility)
  // -------------------------------------------------
  listPageSections: defineAction({
    input: z.object({ pageSlug: z.string().default('accueil') }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      return db.select().from(schema.pageSections)
        .where(eq(schema.pageSections.pageSlug, input.pageSlug))
        .orderBy(asc(schema.pageSections.sortOrder));
    },
  }),

  savePageSections: defineAction({
    input: z.object({
      pageSlug: z.string().default('accueil'),
      sections: z.array(z.object({
        sectionKey: z.string().min(1).max(50),
        sortOrder: z.number().int().min(0),
        isVisible: z.boolean(),
      })),
    }),
    handler: async (input, ctx) => {
      adminGuard(ctx);
      // Remove sections no longer in the list
      const currentKeys = input.sections.map(s => s.sectionKey);
      const existing = await db.select({ sectionKey: schema.pageSections.sectionKey })
        .from(schema.pageSections)
        .where(eq(schema.pageSections.pageSlug, input.pageSlug));
      for (const row of existing) {
        if (!currentKeys.includes(row.sectionKey)) {
          await db.delete(schema.pageSections)
            .where(and(
              eq(schema.pageSections.pageSlug, input.pageSlug),
              eq(schema.pageSections.sectionKey, row.sectionKey),
            ));
        }
      }
      // Upsert sections
      for (const s of input.sections) {
        await db.insert(schema.pageSections).values({
          pageSlug: input.pageSlug,
          sectionKey: s.sectionKey,
          sortOrder: s.sortOrder,
          isVisible: s.isVisible,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: [schema.pageSections.pageSlug, schema.pageSections.sectionKey],
          set: {
            sortOrder: s.sortOrder,
            isVisible: s.isVisible,
            updatedAt: new Date(),
          },
        });
      }
      invalidateSettingsCache();
      return { success: true };
    },
  }),
};

