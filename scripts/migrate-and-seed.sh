#!/bin/sh

set -e

# Wait for db to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  sleep 1
done

echo "✅ PostgreSQL is ready!"

echo "📦 Generating Prisma Client..."
pnpm db:generate

echo "📈 Running Migrations..."
pnpm db:migrate

echo "🌱 Seeding database..."
pnpm gen:permissions
pnpm db:user-seed

echo "✅ Done!"
