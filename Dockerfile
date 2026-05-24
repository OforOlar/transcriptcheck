# ============================================================
# TranscriptCheck — Dockerfile
# Unit 3 Sec 3.4.8 — Runtime Configuration: build and runtime
#   environment defined entirely as code
# Unit 3 Sec 3.3.6 — Construction with Reuse: official Node.js
#   Alpine image reused as the base
# ============================================================

# ── STAGE 1: Dependencies ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ── STAGE 2: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Accept NEXT_PUBLIC_ vars as build arguments.
# Next.js bakes NEXT_PUBLIC_ variables into the client-side
# JavaScript bundle at BUILD TIME — they must be available here,
# not just at runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

# Expose them as environment variables for the Next.js build process
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── STAGE 3: Production Runner ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public       ./public
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]