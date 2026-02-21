#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."

# Wait for database with retries
MAX_RETRIES=15
RETRY_COUNT=0

until npx prisma db push --accept-data-loss 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 5s..."
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Could not connect to database after $MAX_RETRIES attempts"
  exit 1
fi

echo "✅ Database ready! Running migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

echo "🚀 Starting LIA Dashboard API..."
exec node dist/index.js
