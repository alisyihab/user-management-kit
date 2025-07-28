#!/bin/bash

echo "🔥 Running in dev mode (watch)..."

pnpm --filter api-gateway dev &
pnpm --filter auth-svc dev &
pnpm --filter backoffice-svc dev

wait
