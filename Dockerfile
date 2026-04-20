FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL is required by prisma generate (PgPg adapter) and next build (mock mode).
# The placeholder value keeps isMock()=true so no real DB connection is attempted at build time.
ARG DATABASE_URL=prisma+postgres://build-placeholder
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Copy prisma schema and seed for db:push / db:seed after deploy.
# prisma.config.ts is intentionally excluded — it imports dotenv which is not
# installed in the runner; DATABASE_URL is injected by Docker instead.
COPY --from=builder /app/prisma ./prisma

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
