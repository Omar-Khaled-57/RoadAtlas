import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * Prisma client singleton. Serverless platforms reuse a process across
 * invocations, so caching the client avoids creating a new connection pool
 * for every request.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

/** Connect once per process (no-op for Prisma, which connects lazily). */
export async function connectDb(): Promise<void> {
  if (!env.DATABASE_URL) {
    logger.warn('running without persistence', {
      detail: 'DATABASE_URL not set; API data routes answer 503.',
    });
    return;
  }
  await db.$connect();
  logger.info('database connected', { database: 'postgresql' });
}

/** Disconnect Prisma client. */
export async function disconnectDb(): Promise<void> {
  await db.$disconnect().catch(() => {
    // ignore disconnect errors
  });
}

export { db };
