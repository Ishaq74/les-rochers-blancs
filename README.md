# Les Rochers Blancs — Hôtel & Restaurant

Site web + back-office du **Les Rochers Blancs**, hôtel-restaurant au sommet du Semnoz (Haute-Savoie).

## Stack technique

| Couche | Technologie |
| --- | --- |
| Framework | Astro 6.1.9 (SSR + `@astrojs/node` standalone) |
| Styles | Tailwind CSS 4.2 (config CSS-first) + Starwind UI |
| Auth | better-auth 1.5.6 |
| Base de données | PostgreSQL 17 via Drizzle ORM 0.45 |
| Conteneurs | Docker + docker-compose |
| i18n | 4 langues : FR, EN, AR (RTL), ZH |

## Prérequis

- Node.js 22+
- pnpm 10+
- PostgreSQL 17 (ou Docker)

## Démarrage local (sans Docker)

```bash
# 1. Cloner et installer les dépendances
pnpm install

# 2. Copier et remplir les variables d'environnement
cp .env.example .env
# Éditez .env — voir section Variables d'environnement

# 3. Appliquer les migrations
pnpm db:migrate

# 4. Créer le compte administrateur
pnpm seed:admin

# 5. (Optionnel) Peupler la base avec des données de démonstration
pnpm db:seed

# 6. Lancer le serveur de développement
pnpm dev
```

L'app est accessible sur `http://localhost:4321`.  
L'interface admin est sur `http://localhost:4321/admin`.

## Déploiement Docker (production)

```bash
# 1. Créer un fichier .env à la racine avec les variables de production
cp .env.example .env

# 2. Définir les secrets obligatoires dans .env :
#    DATABASE_URL=postgresql://user:pass@db-host:5432/dbname?sslmode=require
#    BETTER_AUTH_SECRET=<chaîne_aléatoire_32_car>
#    APP_DOMAIN=votre-domaine.fr   # sans https://

# 3. Construire et démarrer les conteneurs
docker compose up -d --build

# 4. Vérifier que la migration automatique est passée
docker compose logs migrate

# 5. Créer le compte admin (première fois uniquement)
docker compose exec -e ADMIN_PASSWORD='<mot-de-passe-admin>' app pnpm seed:admin
```

Le service `migrate` exécute automatiquement `pnpm db:wait && pnpm db:baseline && pnpm db:migrate` au démarrage. Il attend donc d'abord que la base soit joignable, ce qui rend le démarrage plus robuste contre une PostgreSQL externe ou un profil local démarré en parallèle.

En production, `docker-compose.yml` est désormais pensé pour une PostgreSQL externe managée: `app` et `migrate` consomment directement `DATABASE_URL`. Le service `db` embarqué reste disponible uniquement via le profil optionnel `local-db` pour des tests ou une recette locale.

Exemple local avec base embarquée:

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@db:5432/rochers_blancs?sslmode=disable

# Démarrer la base locale optionnelle puis le reste de la stack
docker compose --profile local-db up -d db
docker compose --profile local-db up -d --build migrate app proxy
```

L'image Docker est séparée en deux cibles: une image `runtime` minimale pour l'application SSR Astro, et une image `migrate` dédiée aux scripts Drizzle/seed. L'application n'embarque donc plus l'outillage de migration dans son conteneur de prod.

En Docker, `BETTER_AUTH_URL` est dérivé automatiquement en `https://${APP_DOMAIN}` pour éviter une dérive entre le domaine public du proxy et le domaine de confiance de l'auth.

`BETTER_AUTH_SECRET` doit faire au moins 32 caractères. Côté auth, l'inscription publique par email/mot de passe est désactivée et le bootstrap admin exige désormais un mot de passe d'au moins 12 caractères.

`pnpm db:baseline` sert uniquement à initialiser le journal Drizzle sur une base déjà existante dont le schéma est présent mais dont `drizzle.__drizzle_migrations` est vide. Sur une base neuve, il ne fait rien, puis `pnpm db:migrate` applique normalement toutes les migrations.

Les fichiers uploadés (médias) sont persistés dans le volume Docker `uploads_data`, hors de `public/`, puis servis à l'URL `/uploads/...`. Les SVG ne sont plus acceptés, et les types non-image sont servis en téléchargement forcé.

Quand `UPLOADS_DIR` est défini, le serveur ne retombe plus silencieusement sur `public/uploads`. Si tu as encore des médias legacy à servir pendant une migration, il faut l'autoriser explicitement via `ALLOW_LEGACY_UPLOAD_FALLBACK=true`.

## Variables d'environnement

| Variable | Obligatoire | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | URL PostgreSQL complète — ex. `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | ✅ | Secret de session (≥ 32 caractères aléatoires) |
| `BETTER_AUTH_URL` | ✅ hors Docker | URL publique de l'application (ex. `https://lesrochersblancs.fr`) |
| `APP_DOMAIN` | Docker | Domaine public utilisé par Caddy pour le reverse proxy et TLS, sans `https://` |
| `SITE_URL` | — | Override pour les canonical/OG ; défaut = `https://lesrochersblancs.fr` |
| `POSTGRES_PASSWORD` | Profil `local-db` | Mot de passe de la PostgreSQL embarquée optionnelle |
| `DB_WAIT_MAX_ATTEMPTS` | — | Nombre maximal de tentatives avant échec du service `migrate` |
| `DB_WAIT_DELAY_MS` | — | Délai entre deux tentatives de connexion DB au démarrage |
| `UPLOADS_DIR` | — | Dossier de stockage des uploads ; défaut = `storage/uploads` |
| `ALLOW_LEGACY_UPLOAD_FALLBACK` | — | Autorise temporairement la lecture depuis `public/uploads` même si `UPLOADS_DIR` est configuré |
| `HOST` | — | Interface d'écoute du serveur (défaut : `0.0.0.0`) |
| `PORT` | — | Port d'écoute (défaut : `4321`) |

## Commandes utiles

```bash
pnpm dev           # Serveur de développement
pnpm build         # Build production
pnpm start         # Démarrer le build de production

pnpm db:baseline   # Baseline Drizzle pour une base existante déjà initialisée
pnpm db:generate   # Générer une migration à partir du schéma
pnpm db:migrate    # Appliquer les migrations en attente
pnpm db:studio     # Ouvrir Drizzle Studio (interface DB)
pnpm db:seed       # Insérer des données de démonstration
pnpm seed:admin    # Créer le compte administrateur initial
```

## Structure des fichiers clés

```text
src/
  actions/index.ts   — Toutes les server actions (admin + public)
  auth/index.ts      — Configuration better-auth
  db/schema.ts       — Schéma Drizzle ORM
  db/index.ts        — Connexion DB (pool 10 connexions, SSL dérivé de DATABASE_URL)
  lib/settings.ts    — Cache des settings/CMS (TTL 60s)
  lib/uploads.ts     — Résolution du stockage des uploads et fallback legacy
  lib/i18n.ts        — Fonction t() avec dot-notation, 4 locales
  middleware.ts      — Auth, CSRF, rate limiting, headers sécurité
  pages/
    [lang]/          — Pages publiques (SSR, prerender=false)
    admin/           — Back-office (protégé, SSR)
    api/health.ts    — Healthcheck Docker (GET /api/health)
    uploads/[...path].ts — Serving runtime des fichiers uploadés
drizzle/             — Fichiers de migration SQL
storage/uploads/     — Fichiers uploadés runtime (gitignored, volume Docker)
```

## Santé et monitoring

Le endpoint `GET /api/health` répond :

- `200 {"status":"ok"}` si la DB est joignable
- `503 {"status":"error"}` si la DB est inaccessible

Utilisé par le `HEALTHCHECK` Docker et docker-compose `depends_on`.

## Sécurité

- **CSRF** : vérification Origin/Referer sur toutes les mutations
- **Rate limiting** : 10 tentatives / 15 min sur le login ; 5 soumissions / 60 min sur le formulaire de contact
- **CSP** : Content-Security-Policy stricte (pas de CDN externe)
- **HSTS** : max-age 2 ans avec `includeSubDomains; preload`
- **Auth guards** : toutes les actions admin vérifient `adminGuard(ctx)`
- **SQL** : Drizzle ORM paramétré, `escapeLikePattern()` sur les recherches LIKE
