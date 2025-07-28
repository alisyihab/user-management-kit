FROM node:20-alpine

WORKDIR /app

COPY . .

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Prisma generate schema
RUN pnpm prisma generate --schema=libs/schema/schema.prisma

# Optional: if you want to make script executable
RUN chmod +x ./scripts/migrate-and-seed.sh

ENTRYPOINT ["sh", "./scripts/migrate-and-seed.sh"]
