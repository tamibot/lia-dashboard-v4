# === Stage 1: Build Frontend ===
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# === Stage 2: Build Backend ===
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ .
RUN npx prisma generate
RUN npm run build

# === Stage 3: Production ===
FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy frontend build into public/
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx tsx prisma/pre-migrate.ts && npx prisma db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && node dist/index.js"]
