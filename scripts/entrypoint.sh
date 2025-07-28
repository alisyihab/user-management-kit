#!/bin/sh

set -e

SERVICE=$1
echo "📦 Starting $SERVICE..."

echo "🧩 Running Prisma generate..."
pnpm db:generate

echo "🚀 Starting $SERVICE..."
exec node dist/apps/$SERVICE/src/main
