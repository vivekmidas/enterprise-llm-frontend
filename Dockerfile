# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
ENV CI=true

RUN apk add --no-cache curl

RUN npm install -g pnpm@12.12.1

# Install deps first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .env.local .env
RUN pnpm install

# Copy source and build
COPY . .
RUN pnpm next build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV CI=true NODE_ENV=production

RUN apk add --no-cache curl
RUN npm install -g pnpm

# Copy only the artifacts needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["pnpm", "next", "start"]