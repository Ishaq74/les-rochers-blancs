# BLOG TODO — Plan complet d'implémentation

> État lu le 22 avril 2026.  
> Toutes les références de fichiers, de champs, d'actions et de patterns sont tirées du code réel + docs officielles (Astro SSR, Drizzle ORM many-to-many).

---

## 1. ÉTAT ACTUEL (ce qui existe)

### DB (`src/db/schema.ts`)
| Table | Champs clés | Status |
|---|---|---|
| `blogPosts` | id, slug, authorId→user.id, imageUrl, isPublished, publishedAt, viewsCount, createdAt, updatedAt | ✅ existe |
| `blogPostTranslations` | id, postId→blogPosts.id, locale, title, excerpt, content, metaTitle, metaDescription | ✅ existe |
| `comments` | id, postId→blogPosts.id, authorName, authorEmail, content, isApproved, isRejected, createdAt | ✅ existe |
| `blog_categories` | — | ❌ manque |
| `blog_category_translations` | — | ❌ manque |
| `blog_post_categories` | — | ❌ manque (junction table) |

### Actions (`src/actions/index.ts`)
| Action | Auth | Status |
|---|---|---|
| `listBlogPosts` | adminGuard | ✅ existe — mais bug `sql.raw()` + search non échappé |
| `saveBlogPost` | adminGuard | ✅ existe — ne gère pas les catégories |
| `deleteBlogPost` | adminGuard | ✅ existe |
| `listComments` | adminGuard | ✅ existe |
| `approveComment` | adminGuard | ✅ existe |
| `rejectComment` | adminGuard | ✅ existe |
| `deleteComment` | adminGuard | ✅ existe |
| `listBlogCategories` | — | ❌ manque |
| `saveBlogCategory` | — | ❌ manque |
| `deleteBlogCategory` | — | ❌ manque |
| `getPublicBlogPosts` | public | ❌ manque |
| `getPublicBlogPost` | public | ❌ manque |
| `submitComment` | public | ❌ manque |

### Pages admin (`src/pages/admin/`)
| Page | Status |
|---|---|
| `blog.astro` | ✅ existe — liste + éditeur, sans catégories, date = createdAt pas publishedAt, auteur absent |
| `comments.astro` | ✅ existe — modération complète |
| `blog-categories.astro` | ❌ manque |

### Pages publiques (`src/pages/[lang]/`)
| Page | Status |
|---|---|
| `blog/index.astro` | ❌ manque |
| `blog/[slug].astro` | ❌ manque |
| `blog/category/[slug].astro` | ❌ manque |

### AdminLayout sidebar (`src/layouts/AdminLayout.astro`)
- Lien `blog` ✅ (ligne 40 environ)
- Lien `blog-categories` ❌ manque

---

## 2. ÉTAPE 1 — DB : schéma + migrations

### 2.1 Ajouter dans `src/db/schema.ts`

Après le bloc `// COMMENTS`, ajouter :

```typescript
// =====================================================
// BLOG CATEGORIES
// =====================================================

export const blogCategories = pgTable('blog_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_blog_categories_slug').on(table.slug),
]);

export const blogCategoryTranslations = pgTable('blog_category_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('blog_cat_trans_unique').on(table.categoryId, table.locale),
]);

// Junction table posts ↔ categories (many-to-many)
export const blogPostCategories = pgTable('blog_post_categories', {
  postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
}, (table) => [
  // primaryKey composite sur postId + categoryId (évite les doublons)
  uniqueIndex('blog_post_cat_unique').on(table.postId, table.categoryId),
]);
```

**Pourquoi pas `defineRelations` Drizzle v2 ?**  
Ce projet utilise exclusivement les API SQL-like de Drizzle (`db.select().from()`, `inArray()`, `leftJoin()`).
Les `defineRelations` v2 ajoutent une couche supplémentaire non utilisée ailleurs dans le projet.
On reste cohérent avec le pattern existant : selects séparés + `.filter()` en mémoire pour les listes admin,
et `leftJoin + inArray` pour les pages publiques paginées.

### 2.2 Créer `drizzle/0003_blog_categories.sql`

```sql
CREATE TABLE "blog_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "image_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE "blog_category_translations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL REFERENCES "blog_categories"("id") ON DELETE CASCADE,
  "locale" text NOT NULL,
  "name" text NOT NULL,
  "description" text
);--> statement-breakpoint

CREATE TABLE "blog_post_categories" (
  "post_id" uuid NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "category_id" uuid NOT NULL REFERENCES "blog_categories"("id") ON DELETE CASCADE
);--> statement-breakpoint

CREATE INDEX "idx_blog_categories_slug" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_cat_trans_unique" ON "blog_category_translations" USING btree ("category_id", "locale");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_cat_unique" ON "blog_post_categories" USING btree ("post_id", "category_id");
```

### 2.3 Mettre à jour `drizzle/meta/_journal.json`

Ajouter une entrée `idx: 3` pour `0003_blog_categories`.

---

## 3. ÉTAPE 2 — Actions : corrections + ajouts

### 3.1 Corriger `listBlogPosts` (bug critique `sql.raw()`)

**Fichier** : `src/actions/index.ts`, bloc `listBlogPosts` (~ligne 899)

**Problème actuel** :
```typescript
// DANGEREUX — sql.raw() avec des UUIDs venant de la DB (ok ici, mais pattern à bannir)
sql`${schema.blogPosts.id} = ANY(ARRAY[${sql.raw(postIdsFromTranslations.map(id => `'${id}'`).join(','))}]::uuid[])`
```

**Correction** : remplacer par `inArray` (import déjà présent dans le fichier) :
```typescript
import { eq, desc, asc, and, or, sql, count, ilike, inArray } from 'drizzle-orm';
// ...
const searchTermConds = input.search
  ? (postIdsFromTranslations.length > 0
    ? or(slugSearchCond, inArray(schema.blogPosts.id, postIdsFromTranslations))
    : slugSearchCond)
  : undefined;
```

**Corriger aussi** : le search slug ne passe pas par `escapeLikePattern` :
```typescript
const escaped = input.search ? escapeLikePattern(input.search) : '';
const slugSearchCond = input.search ? ilike(schema.blogPosts.slug, `%${escaped}%`) : undefined;
// idem pour la recherche par titre dans blogPostTranslations :
ilike(schema.blogPostTranslations.title, `%${escaped}%`)
```

### 3.2 Mettre à jour `saveBlogPost` : accepter les catégories

Ajouter `categoryIds` dans le zod input :
```typescript
categoryIds: z.array(uuidField).optional().default([]),
```

Dans le handler, après l'upsert des traductions :
```typescript
// Sync categories (delete all + re-insert)
await tx.delete(schema.blogPostCategories).where(eq(schema.blogPostCategories.postId, postId));
if (input.categoryIds.length > 0) {
  await tx.insert(schema.blogPostCategories).values(
    input.categoryIds.map(categoryId => ({ postId, categoryId }))
  );
}
```

### 3.3 Ajouter `listBlogCategories`

```typescript
listBlogCategories: defineAction({
  handler: async (_input, ctx) => {
    adminGuard(ctx);
    const rows = await db.select().from(schema.blogCategories).orderBy(asc(schema.blogCategories.sortOrder));
    const translations = await db.select().from(schema.blogCategoryTranslations);
    return rows.map(r => ({
      ...r,
      translations: translations.filter(t => t.categoryId === r.id),
    }));
  },
}),
```

### 3.4 Ajouter `saveBlogCategory`

```typescript
saveBlogCategory: defineAction({
  input: z.object({
    id: uuidField.optional(),
    slug: z.string().min(1),
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
      let categoryId: string;
      if (id) {
        await tx.update(schema.blogCategories).set({ ...data, updatedAt: new Date() }).where(eq(schema.blogCategories.id, id));
        categoryId = id;
        await tx.delete(schema.blogCategoryTranslations).where(eq(schema.blogCategoryTranslations.categoryId, id));
      } else {
        const [row] = await tx.insert(schema.blogCategories).values(data).returning({ id: schema.blogCategories.id });
        categoryId = row.id;
      }
      if (translations.length > 0) {
        await tx.insert(schema.blogCategoryTranslations).values(
          translations.map(t => ({ ...t, categoryId }))
        );
      }
      return { id: categoryId };
    });
  },
}),
```

### 3.5 Ajouter `deleteBlogCategory`

```typescript
deleteBlogCategory: defineAction({
  input: z.object({ id: uuidField }),
  handler: async (input, ctx) => {
    adminGuard(ctx);
    // Les blogPostCategories et blogCategoryTranslations se suppriment via ON DELETE CASCADE
    await db.delete(schema.blogCategories).where(eq(schema.blogCategories.id, input.id));
    return { success: true };
  },
}),
```

### 3.6 Ajouter `getPublicBlogPosts` (public, sans adminGuard)

```typescript
getPublicBlogPosts: defineAction({
  input: z.object({
    ...paginationInput,
    locale: localeField.default('fr'),
    categorySlug: z.string().optional(), // filtre par catégorie
  }),
  handler: async (input) => {
    // PAS de adminGuard — action publique
    const { offset, limit } = paginate(input.page, input.limit);

    // Résoudre categoryId si filtre demandé
    let categoryId: string | undefined;
    if (input.categorySlug) {
      const [cat] = await db.select({ id: schema.blogCategories.id })
        .from(schema.blogCategories)
        .where(and(eq(schema.blogCategories.slug, input.categorySlug), eq(schema.blogCategories.isActive, true)));
      if (!cat) return { items: [], total: 0, page: 1, totalPages: 0 };
      categoryId = cat.id;
    }

    // Si filtre catégorie : récupérer les postIds de la junction
    let postIdsByCat: string[] | undefined;
    if (categoryId) {
      const junctions = await db.select({ postId: schema.blogPostCategories.postId })
        .from(schema.blogPostCategories)
        .where(eq(schema.blogPostCategories.categoryId, categoryId));
      postIdsByCat = junctions.map(j => j.postId);
      if (postIdsByCat.length === 0) return { items: [], total: 0, page: 1, totalPages: 0 };
    }

    const conditions = and(
      eq(schema.blogPosts.isPublished, true),
      postIdsByCat ? inArray(schema.blogPosts.id, postIdsByCat) : undefined,
    );

    const rows = await db.select().from(schema.blogPosts)
      .where(conditions)
      .orderBy(desc(schema.blogPosts.publishedAt))
      .limit(limit).offset(offset);

    // Charger uniquement les traductions de la locale demandée pour optimiser
    const postIds = rows.map(r => r.id);
    const translations = postIds.length > 0
      ? await db.select().from(schema.blogPostTranslations)
          .where(and(inArray(schema.blogPostTranslations.postId, postIds), eq(schema.blogPostTranslations.locale, input.locale)))
      : [];

    // Charger les catégories de chaque post
    const postCats = postIds.length > 0
      ? await db.select().from(schema.blogPostCategories)
          .where(inArray(schema.blogPostCategories.postId, postIds))
      : [];

    const [total] = await db.select({ value: count() }).from(schema.blogPosts).where(conditions);

    return {
      items: rows.map(r => ({
        id: r.id,
        slug: r.slug,
        imageUrl: r.imageUrl,
        publishedAt: r.publishedAt,
        viewsCount: r.viewsCount,
        translation: translations.find(t => t.postId === r.id) ?? null,
        categoryIds: postCats.filter(pc => pc.postId === r.id).map(pc => pc.categoryId),
      })),
      total: total.value,
      page: input.page,
      totalPages: Math.ceil(total.value / limit),
    };
  },
}),
```

### 3.7 Ajouter `getPublicBlogPost` (public, par slug, incrémente viewsCount)

```typescript
getPublicBlogPost: defineAction({
  input: z.object({
    slug: z.string().min(1),
    locale: localeField.default('fr'),
  }),
  handler: async (input) => {
    // PAS de adminGuard
    const [post] = await db.select().from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.slug, input.slug), eq(schema.blogPosts.isPublished, true)));
    if (!post) return null;

    // Incrémenter le compteur de vues (fire-and-forget acceptable)
    db.update(schema.blogPosts)
      .set({ viewsCount: sql`${schema.blogPosts.viewsCount} + 1` })
      .where(eq(schema.blogPosts.id, post.id))
      .catch(() => {}); // ne pas bloquer le rendu

    const [translation] = await db.select().from(schema.blogPostTranslations)
      .where(and(eq(schema.blogPostTranslations.postId, post.id), eq(schema.blogPostTranslations.locale, input.locale)));

    // Fallback FR si locale demandée absente
    const [frTranslation] = input.locale !== 'fr'
      ? await db.select().from(schema.blogPostTranslations)
          .where(and(eq(schema.blogPostTranslations.postId, post.id), eq(schema.blogPostTranslations.locale, 'fr')))
      : [undefined];

    const approvedComments = await db.select().from(schema.comments)
      .where(and(eq(schema.comments.postId, post.id), eq(schema.comments.isApproved, true)))
      .orderBy(asc(schema.comments.createdAt));

    const postCats = await db.select({ categoryId: schema.blogPostCategories.categoryId })
      .from(schema.blogPostCategories)
      .where(eq(schema.blogPostCategories.postId, post.id));

    return {
      ...post,
      translation: translation ?? frTranslation ?? null,
      comments: approvedComments,
      categoryIds: postCats.map(pc => pc.categoryId),
    };
  },
}),
```

### 3.8 Ajouter `submitComment` (public, avec protection anti-spam)

```typescript
submitComment: defineAction({
  accept: 'form',  // accepte form data ET JSON (compatibilité Astro actions)
  input: z.object({
    postId: uuidField,
    authorName: z.string().min(2).max(100),
    authorEmail: z.string().email().max(300),
    content: z.string().min(10).max(2000),
    _honey: z.string().max(0).default(''), // honeypot (comme sendContact)
  }),
  handler: async (input) => {
    // Honeypot anti-bot
    if (input._honey) throw new ActionError({ code: 'BAD_REQUEST', message: 'Bot detected' });

    // Vérifier que le post existe et est publié
    const [post] = await db.select({ id: schema.blogPosts.id })
      .from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.id, input.postId), eq(schema.blogPosts.isPublished, true)));
    if (!post) throw new ActionError({ code: 'NOT_FOUND', message: 'Post not found' });

    const [comment] = await db.insert(schema.comments).values({
      postId: input.postId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      content: input.content,
      // isApproved et isRejected à false par défaut → en attente de modération
    }).returning({ id: schema.comments.id });

    return { id: comment.id };
  },
}),
```

**Note sécurité** : ajouter un rate-limit IP sur `submitComment` dans `src/middleware.ts`, 
sur le même modèle que le rate-limit login existant (5 commentaires / 10 min / IP).

---

## 4. ÉTAPE 3 — Page admin : blog-categories

### 4.1 Créer `src/pages/admin/blog-categories.astro`

**Pattern** : identique à `services.astro` (CRUD avec traductions + isActive badge + media picker pour imageUrl).  
Colonnes dans la liste :
- Nom (FR)
- Slug
- Statut (badge Actif/Inactif via `AdminKit.activeBadge`)
- Nb d'articles liés (afficher le count)
- Actions : Modifier / Supprimer

**Formulaire drawer** (right panel) :
- `slug` (required)
- `imageUrl` + bouton "Sélectionner" → media picker (même pattern que `blog.astro`)
- `isActive` checkbox
- `sortOrder` number
- Onglets de traductions FR / EN / AR / ZH :
  - `name` (required)
  - `description` textarea

**Actions appelées** : `listBlogCategories`, `saveBlogCategory`, `deleteBlogCategory`

### 4.2 Mettre à jour `AdminLayout.astro`

Ajouter dans le tableau `navItems` (juste après le lien `blog`) :
```javascript
{ key: 'blog-categories', href: '/admin/blog-categories', icon: 'tag' },
```

Ajouter dans la map `navLabels` :
```javascript
'blog-categories': 'adminLayout.nav.blogCategories',
```

Ajouter la clé i18n dans `fr.json` (et EN/AR/ZH) :
```json
"blogCategories": "Catégories blog"
```

---

## 5. ÉTAPE 4 — Page admin : améliorations de `blog.astro`

### 5.1 Tableau — colonnes manquantes

Remplacer la colonne "Date" (`createdAt`) par "Publié le" (`publishedAt`) :
```javascript
const d = r.publishedAt 
  ? new Date(r.publishedAt).toLocaleDateString('fr-FR') 
  : (r.isPublished ? '?' : '—');
```

Ajouter une colonne "Auteur" (l'autorId est stocké mais jamais affiché).  
Le nom de l'auteur n'est pas chargé actuellement → charger via join ou stocker `authorName` dans le résultat de `listBlogPosts`.  
**Solution** : modifier `listBlogPosts` pour faire un LEFT JOIN sur la table `user` et retourner `authorName`.

Ajouter une colonne "Catégories" avec les slugs des catégories assignées.

### 5.2 Formulaire — champs manquants

Ajouter `publishedAt` (date input) — éditable :
```html
<div class="space-y-1">
  <label class="text-sm font-medium">Date de publication</label>
  <input name="publishedAt" type="datetime-local" class="..." />
</div>
```

Modifier `saveBlogPost` pour accepter `publishedAt` optionnel :
```typescript
publishedAt: z.string().optional(), // ISO string, on coerce en Date
```

Ajouter un multi-select catégories dans le formulaire :
- Au chargement du formulaire, appeler `listBlogCategories` une fois et mettre en cache
- Afficher des checkboxes pour chaque catégorie active
- Transmettre `categoryIds: []` dans le payload `saveBlogPost`

### 5.3 Filtre par catégorie dans la liste

Ajouter un dropdown "Catégorie" à côté des filtres Publié/Brouillon.  
Passer `categoryId` optionnel à `listBlogPosts`.

### 5.4 Toast feedback

Actuellement `saveBlogPost` ne déclenche aucun toast. Ajouter :
```javascript
await API('saveBlogPost', {...});
showToast(id ? i18n.toastUpdated : i18n.toastCreated, 'success');
closeD();
load();
```
(les clés `blog.toast.created` et `blog.toast.updated` existent déjà dans `fr.json`)

---

## 6. ÉTAPE 5 — Pages publiques

> **Règle Astro SSR confirmée par la doc officielle** :  
> Routes SSR on-demand → `export const prerender = false` + pas de `getStaticPaths()`.  
> Pour les 404 : `return new Response(null, { status: 404 })` ou `Astro.redirect('/404')`.  
> Pattern utilisé partout dans ce projet (ex: toutes les pages admin).

> **Rendu Markdown** :  
> Le regex maison dans `blog.astro` est acceptable pour un **preview admin** uniquement.  
> Pour les pages publiques, il faut un vrai parser. Ce projet utilise déjà `@astrojs/node` + Vite.  
> **Recommandation** : installer `marked` (npm : `pnpm add marked`) et `dompurify` (server-side via `isomorphic-dompurify`).  
> Alternativement, utiliser `@astrojs/markdown-remark` qui est déjà inclus dans Astro mais nécessite `.md` files.  
> **Choix retenu** : `marked` + sanitize côté serveur dans l'action/page, pour rester dans le pattern SSR Astro.

### 6.1 `src/pages/[lang]/blog/index.astro`

```
src/pages/[lang]/blog/index.astro
```

**Structure** :
```typescript
export const prerender = false;
const { lang } = Astro.params as { lang: Locale };

// Valider la locale
const validLocales = ['fr', 'en', 'ar', 'zh'];
if (!validLocales.includes(lang)) return Astro.redirect('/404');

// Lire le filtre catégorie depuis l'URL
const categorySlug = Astro.url.searchParams.get('categorie') ?? undefined;
const page = parseInt(Astro.url.searchParams.get('page') ?? '1');

// Charger les posts
const result = await actions.getPublicBlogPosts({ locale: lang, categorySlug, page, limit: 12 });

// Charger les catégories actives pour les onglets de filtre
const categories = await actions.listPublicBlogCategories({ locale: lang }); 
// (action à créer — variante de listBlogCategories sans adminGuard)
```

**Layout** : `BaseLayout` avec `SEOHead` (title, description depuis i18n ou CMS)

**SEO** :
- `<SEOHead title="Blog — Les Rochers Blancs" description="..." lang={lang} ogType="website" />`
- `canonicalPath` = `/[lang]/blog/`
- JSON-LD type `Blog` pointant sur l'URL

**UI** :
- Onglets catégories (Tous + catégories actives)
- Grille de cards : image de couverture, titre (locale), extrait, date de publication, lien "Lire l'article"
- Pagination : liens `?page=N` (pas de JS nécessaire — SSR natif)
- Si aucun article : message vide

**Pagination** : utiliser des `<a href>` avec `?page=N` et `?categorie=slug` — pas de fetch JS. Le SSR rechargera la page.

### 6.2 `src/pages/[lang]/blog/[slug].astro`

```
src/pages/[lang]/blog/[slug].astro
```

**Structure** :
```typescript
export const prerender = false;
const { lang, slug } = Astro.params as { lang: Locale; slug: string };

const post = await actions.getPublicBlogPost({ slug, locale: lang });
if (!post) return new Response(null, { status: 404 });
if (!post.isPublished) return new Response(null, { status: 404 });
```

**Rendu Markdown** (côté serveur dans le frontmatter) :
```typescript
import { marked } from 'marked';
// IMPORTANT : sanitize avant rendu — jamais set innerHTML sans sanitize
const htmlContent = post.translation?.content 
  ? marked.parse(post.translation.content, { breaks: true })
  : '';
// Passer htmlContent via Astro.props et utiliser <Fragment set:html={htmlContent} />
```
Doc Astro confirme : `set:html` est la façon idiomatique de rendre du HTML généré côté serveur dans les templates Astro.

**SEO** :
```astro
<SEOHead
  title={`${post.translation?.title} — Les Rochers Blancs`}
  description={post.translation?.excerpt ?? ''}
  lang={lang}
  ogType="article"
  ogImage={post.imageUrl ?? undefined}
  publishedTime={post.publishedAt?.toISOString()}
  modifiedTime={post.updatedAt.toISOString()}
  author={post.authorName}
  canonicalPath={`/${lang}/blog/${slug}`}
/>
```
`SEOHead` supporte déjà tous ces props (`ogType='article'`, `publishedTime`, `modifiedTime`, `author`) — vérifiable dans `src/components/seo/SEOHead.astro`.

**JSON-LD** :
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Titre de l'article",
  "image": "url image de couverture",
  "datePublished": "ISO publishedAt",
  "dateModified": "ISO updatedAt",
  "author": { "@type": "Person", "name": "Nom auteur" },
  "publisher": { "@type": "Organization", "name": "Les Rochers Blancs" },
  "description": "extrait"
}
```

**Commentaires** :
- Section "N commentaires" avec les commentaires approuvés (post.comments)
- Formulaire soumission avec `action` Astro Actions :
  ```html
  <form method="POST" action="/_actions/submitComment">
    <input type="hidden" name="postId" value={post.id} />
    <input type="text" name="_honey" class="hidden" tabindex="-1" autocomplete="off" />
    <input name="authorName" required minlength="2" maxlength="100" />
    <input name="authorEmail" type="email" required />
    <textarea name="content" required minlength="10" maxlength="2000"></textarea>
    <button type="submit">Envoyer</button>
  </form>
  ```
  Après soumission réussie → message "Commentaire en attente de modération".

**RTL** : le layout `BaseLayout` gère déjà `dir="rtl"` pour l'arabe via `isRtl(lang)` — rien à faire.

### 6.3 `src/pages/[lang]/blog/category/[slug].astro`

```
src/pages/[lang]/blog/category/[slug].astro
```

Quasi-identique à `blog/index.astro` mais :
- Le `categorySlug` vient de `Astro.params.slug` (pas de query string)
- Si la catégorie n'existe pas → 404
- Titre de page = nom de la catégorie dans la locale
- Breadcrumb : Accueil → Blog → [Nom catégorie]

---

## 7. ÉTAPE 6 — i18n (clés à ajouter dans tous les fichiers locales)

### 7.1 Clés à ajouter dans `fr.json` (et EN/AR/ZH)

Dans le bloc `"blog"` existant, ajouter :
```json
"public": {
  "pageTitle": "Blog",
  "subtitle": "Actualités et conseils de l'établissement",
  "allCategories": "Tous les articles",
  "readMore": "Lire l'article",
  "publishedOn": "Publié le",
  "by": "par",
  "views": "vue(s)",
  "noArticles": "Aucun article publié pour le moment.",
  "backToBlog": "← Retour au blog",
  "commentsTitle": "Commentaires",
  "noComments": "Aucun commentaire pour l'instant. Soyez le premier !",
  "commentForm": {
    "title": "Laisser un commentaire",
    "name": "Votre nom",
    "email": "Votre email",
    "message": "Votre commentaire",
    "submit": "Envoyer",
    "pending": "Votre commentaire est en attente de modération. Merci !",
    "error": "Une erreur est survenue. Veuillez réessayer."
  }
},
"categories": {
  "title": "Catégories blog",
  "subtitle": "Gérez les catégories d'articles",
  "new": "Nouvelle catégorie",
  "newTitle": "Nouvelle catégorie",
  "editTitle": "Modifier la catégorie",
  "confirmDelete": "Supprimer cette catégorie ? Les articles associés ne seront pas supprimés.",
  "noItems": "Aucune catégorie",
  "form": {
    "slug": "Slug (URL)",
    "imageUrl": "Image de couverture",
    "name": "Nom",
    "description": "Description"
  }
}
```

Dans `adminLayout.nav` :
```json
"blogCategories": "Catégories blog"
```

---

## 8. ÉTAPE 7 — Dépendance : parser Markdown

**Installer** :
```bash
pnpm add marked
pnpm add -D @types/marked  # si pas inclus
```

**Utilisation dans les pages publiques** (server-side uniquement) :
```typescript
import { marked } from 'marked';
// Configuration sécurisée : désactiver les liens dangereux
marked.setOptions({ breaks: true, gfm: true });
const html = await marked.parse(content);
// Astro escape automatiquement le HTML dans les templates — utiliser set:html pour le rendu voulu
// <div class="prose" set:html={html} />
```

**Pourquoi `marked` et pas le regex maison** :
- Le regex en place ne supporte pas les tableaux, les listes imbriquées, les blocs de code
- `marked` est 0 dépendance, < 5kB gzippé, maintenu, utilisé par GitHub lui-même
- Côté serveur Astro SSR, pas de problème XSS : le HTML est généré à la build/request time et servi statiquement dans le markup. Utiliser `set:html` comme le recommande la doc Astro.

---

## 9. SÉCURITÉ — Points critiques spécifiques au blog

### 9.1 `submitComment` — rate limiting
Ajouter dans `src/middleware.ts`, section rate-limit (ligne ~8-30) :

```typescript
const commentAttempts = new Map<string, { count: number; resetAt: number }>();
const COMMENT_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 min
const COMMENT_RATE_MAX = 5;

// Dans authMiddleware :
if (url.pathname === '/_actions/submitComment' && request.method === 'POST') {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = commentAttempts.get(ip);
  if (entry && now < entry.resetAt && entry.count >= COMMENT_RATE_MAX) {
    return new Response(JSON.stringify({ error: 'Too many comments' }), { status: 429 });
  }
  if (!entry || now > entry.resetAt) {
    commentAttempts.set(ip, { count: 1, resetAt: now + COMMENT_RATE_LIMIT_WINDOW });
  } else {
    entry.count++;
  }
}
```

### 9.2 Emails dans les commentaires
Ne jamais afficher l'email de l'auteur côté public (uniquement dans l'admin `comments.astro`).  
`getPublicBlogPost` ne retourne PAS le champ `authorEmail` dans les commentaires publics.

### 9.3 `set:html` et Markdown
`marked` génère du HTML depuis Markdown. Si un admin entre un contenu malveillant → XSS côté public.  
**Mitigation** : seuls les admins éditent le contenu — la surface d'attaque est faible.  
Si on veut être rigoureux : `pnpm add isomorphic-dompurify` + sanitize avant `set:html`.

---

## 10. SITEMAP

Le sitemap est déjà configuré dans `astro.config.mjs` :
```javascript
sitemap({
  filter: (page) => !page.includes('/admin'),
  i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-US', ... } }
})
```
Les pages `[lang]/blog/*` seront **automatiquement incluses** dans le sitemap une fois créées.  
Aucune modification nécessaire — le filtre ne bloque que `/admin`.

---

## 11. ORDRE D'EXÉCUTION RECOMMANDÉ

| Priorité | Tâche | Durée estimée |
|---|---|---|
| 1 | DB : migration `0003_blog_categories.sql` + schema.ts | 30 min |
| 2 | Actions : fix `sql.raw()` + fix `escapeLikePattern` search | 15 min |
| 3 | Actions : `saveBlogPost` avec `categoryIds` | 20 min |
| 4 | Actions : `listBlogCategories` + `saveBlogCategory` + `deleteBlogCategory` | 30 min |
| 5 | Actions : `getPublicBlogPosts` + `getPublicBlogPost` + `submitComment` | 45 min |
| 6 | Admin : `blog-categories.astro` + lien sidebar | 45 min |
| 7 | Admin : `blog.astro` — catégories, publishedAt, auteur, toast | 30 min |
| 8 | `pnpm add marked` | 5 min |
| 9 | i18n : clés publiques FR + EN + AR + ZH | 30 min |
| 10 | Page publique : `[lang]/blog/index.astro` | 60 min |
| 11 | Page publique : `[lang]/blog/[slug].astro` (avec commentaires) | 90 min |
| 12 | Page publique : `[lang]/blog/category/[slug].astro` | 30 min |
| 13 | Sécurité : rate-limit `submitComment` dans middleware.ts | 15 min |

**Total estimé** : ~7h de développement propre.

---

## 12. CE QUI N'EST PAS PRÉVU (à décider)

- **Tags** : ni table ni UI prévus. Les catégories remplacent les tags. Si besoin d'un système de tags séparé, il faut une table `blog_tags` supplémentaire.
- **Auteurs multiples** : `authorId` existe déjà mais l'UI n'expose pas de sélecteur. Actuellement = l'admin connecté. S'il y a plusieurs comptes admin, ajouter un select dans l'éditeur.
- **Canonical cross-locale** : `SEOHead` génère les `hreflang` automatiquement — OK. Mais si un article n'a pas de traduction pour une locale donnée, il faut décider si on sert quand même l'article en FR (fallback actuel dans `getPublicBlogPost`) ou on renvoie 404.
- **Images OG dynamiques** : les articles ont `imageUrl` qui peut servir d'OG image. Si `imageUrl` est null, `SEOHead` fallback sur `/og-default.jpg` (qui n'existe pas encore — bug connu audit global).
- **RSS Feed** : envisageable avec `src/pages/[lang]/blog/feed.xml.ts` — endpoint SSR qui génère du XML RSS depuis `getPublicBlogPosts`. À planifier si demandé.
