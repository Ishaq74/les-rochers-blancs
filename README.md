# Les Rochers Blancs — Hôtel & Restaurant

Site web + back-office du **Les Rochers Blancs**, hôtel-restaurant au sommet du Semnoz (Haute-Savoie).

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Astro 6.1.1 (SSR + `@astrojs/node` standalone) |
| Styles | Tailwind CSS 4.2 (config CSS-first) + Starwind UI |
| Auth | better-auth 1.5.6 |
| Base de données | PostgreSQL 17 via Drizzle ORM 0.45 |
| Conteneurs | Docker + docker-compose |
| i18n | 4 langues : FR, EN, AR (RTL), ZH |

## Prérequis

- Node.js 22+
- pnpm 9+
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

L'app est accessible sur http://localhost:4321.  
L'interface admin est sur http://localhost:4321/admin.

## Déploiement Docker (production)

```bash
# 1. Créer un fichier .env à la racine avec les variables de production
cp .env.example .env

# 2. Définir les secrets obligatoires dans .env :
#    POSTGRES_PASSWORD=<mot_de_passe_fort>
#    BETTER_AUTH_SECRET=<chaîne_aléatoire_32_car>
#    BETTER_AUTH_URL=https://votre-domaine.fr

# 3. Construire et démarrer les conteneurs
docker compose up -d --build

# 4. Appliquer les migrations (première fois ou après mise à jour)
docker compose exec app pnpm db:migrate

# 5. Créer le compte admin (première fois uniquement)
docker compose exec app pnpm seed:admin
```

Les fichiers uploadés (médias) sont persistés dans le volume Docker `uploads_data`.

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | URL PostgreSQL complète — ex. `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | ✅ | Secret de session (≥ 32 caractères aléatoires) |
| `BETTER_AUTH_URL` | ✅ | URL publique de l'application (ex. `https://lesrochersblancs.fr`) |
| `SITE_URL` | — | Override pour les canonical/OG ; défaut = `https://lesrochersblancs.fr` |
| `POSTGRES_PASSWORD` | Docker | Mot de passe PostgreSQL utilisé par docker-compose |
| `HOST` | — | Interface d'écoute du serveur (défaut : `0.0.0.0`) |
| `PORT` | — | Port d'écoute (défaut : `4321`) |

## Commandes utiles

```bash
pnpm dev           # Serveur de développement
pnpm build         # Build production
pnpm start         # Démarrer le build de production

pnpm db:generate   # Générer une migration à partir du schéma
pnpm db:migrate    # Appliquer les migrations en attente
pnpm db:studio     # Ouvrir Drizzle Studio (interface DB)
pnpm db:seed       # Insérer des données de démonstration
pnpm seed:admin    # Créer le compte administrateur initial
```

## Structure des fichiers clés

```
src/
  actions/index.ts   — Toutes les server actions (admin + public)
  auth/index.ts      — Configuration better-auth
  db/schema.ts       — Schéma Drizzle ORM
  db/index.ts        — Connexion DB (pool 10 connexions, SSL en prod)
  lib/settings.ts    — Cache des settings/CMS (TTL 60s)
  lib/i18n.ts        — Fonction t() avec dot-notation, 4 locales
  middleware.ts      — Auth, CSRF, rate limiting, headers sécurité
  pages/
    [lang]/          — Pages publiques (SSR, prerender=false)
    admin/           — Back-office (protégé, SSR)
    api/health.ts    — Healthcheck Docker (GET /api/health)
drizzle/             — Fichiers de migration SQL
public/uploads/      — Fichiers uploadés (gitignored, volume Docker)
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
