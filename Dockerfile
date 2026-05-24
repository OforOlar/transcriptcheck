# ============================================================
# TranscriptCheck — Dockerfile
# Unit 3 Sec 3.4.8 — Runtime Configuration: the entire build
#   and runtime environment is defined as code, not configured
#   manually on any machine
# Unit 3 Sec 3.3.6 — Construction with Reuse: we reuse the
#   official Node.js Alpine image rather than building from scratch
# ============================================================

# ── STAGE 1: Dependencies ────────────────────────────────────
# Use the official lightweight Node.js 20 image as the base.
# Alpine Linux is used because it is only 5MB — much smaller
# than the full Ubuntu-based Node image.
FROM node:20-alpine AS deps

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first.
# Docker caches this layer — if package.json has not changed,
# npm install is skipped on the next build (faster rebuilds).
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci --frozen-lockfile

# ── STAGE 2: Builder ─────────────────────────────────────────
# A separate stage for building the Next.js application.
# Multi-stage builds keep the final image small by not including
# build tools in the production image.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application source code
COPY . .

# Build the Next.js application for production
# This creates the optimised .next/standalone output
RUN npm run build

# ── STAGE 3: Production Runner ───────────────────────────────
# The final, minimal production image.
# Only includes what is needed to run the app — not build tools.
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production for performance optimisations
ENV NODE_ENV=production

# Create a non-root user for security.
# Running as root inside a container is a security risk.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the built output from the builder stage
COPY --from=builder /app/public       ./public
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Give ownership of the app files to the non-root user
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose port 3000 — the port Next.js listens on
EXPOSE 3000
ENV PORT=3000

# The command that runs when the container starts
CMD ["node_modules/.bin/next", "start", "-p", "3000"]