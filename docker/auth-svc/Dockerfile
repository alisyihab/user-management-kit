# ======================
# STAGE 1: DEPENDENCY INSTALL
# ======================
FROM node:20-slim AS deps

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

RUN pnpm install

# ======================
# STAGE 2: BUILD
# ======================
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY --from=deps /app /app

RUN pnpm db:generate

RUN pnpm --filter "auth-svc" exec nest build

# ======================
# STAGE 3: RUN APP
# ======================
FROM node:20-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/.env .
COPY --from=builder /app/pnpm-workspace.yaml .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/libs libs/
COPY --from=builder /app/scripts scripts

# Set the service name for entrypoint script
ENV SERVICE_NAME=auth-svc
ENTRYPOINT ["sh", "./scripts/entrypoint.sh"]
CMD ["auth-svc"]

