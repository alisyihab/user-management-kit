# ======================
# STAGE 1: DEPENDENCY INSTALL
# ======================
FROM node:20-alpine AS deps


WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

RUN pnpm install

# ======================
# STAGE 2: BUILD
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY --from=deps /app /app

# Set environment variable to ignore missing checksum BEFORE running Prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

RUN pnpm db:generate

RUN pnpm --filter "api-gateway" run build

# ======================
# STAGE 3: RUN APP
# ======================
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/.env .
COPY --from=builder /app/pnpm-workspace.yaml .

CMD ["node", "dist/apps/api-gateway/src/main"]
