# =============================================
# Build stage
# =============================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# =============================================
# Production dependencies only
# =============================================
FROM build AS prod-deps
RUN pnpm prune --prod

# =============================================
# Migration stage
# =============================================
FROM node:22-alpine AS migrate

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./
COPY --from=build --chown=app:app /app/tsconfig.json ./
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/src/db ./src/db

USER app

# =============================================
# Runtime stage
# =============================================
FROM node:22-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./

RUN mkdir -p /app/storage/uploads && chown -R app:app /app/storage

USER app

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
ENV UPLOADS_DIR=/app/storage/uploads

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4321/api/health || exit 1

CMD ["node", "dist/server/entry.mjs"]