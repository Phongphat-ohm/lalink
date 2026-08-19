# =====================================================================
# LALINK — Production Dockerfile (Next.js 16 + Prisma 7 + Driver Adapter)
# =====================================================================

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

# Prisma 7 requires openssl at runtime for migrations
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: Builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time -> pass as build args
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LIFF_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_LIFF_ID=$NEXT_PUBLIC_LIFF_ID
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client, then build the Next.js app.
# Note: we run `next build` directly (not `npm run build`) because the npm
# build script also runs `prisma migrate deploy`, which needs a live DB.
# Migrations run at container start via docker/entrypoint.sh instead.
RUN npx prisma generate && npx next build

# ---- Stage 3: Runner ----
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat && \
  addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Prisma schema + migrations + seed for runtime migrate/seed
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js build output + static assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Entrypoint: run migrate deploy (optionally seed) before starting the server
COPY --from=builder /app/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]