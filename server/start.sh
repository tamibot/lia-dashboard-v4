#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Try migrate deploy first (production), fall back to db push (no migration history)
./node_modules/.bin/prisma migrate deploy 2>/dev/null || \
  ./node_modules/.bin/prisma db push --accept-data-loss

echo "🚀 Starting LIA Dashboard API..."
exec node dist/index.js
