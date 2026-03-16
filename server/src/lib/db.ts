import { PrismaClient } from '@prisma/client';

// Singleton Prisma client — shared across all route files
// Prevents multiple connection pools being created (one per route file)
const db = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default db;
