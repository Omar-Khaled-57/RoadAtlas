import { env } from '../config/env';
import { logger } from '../lib/logger';
import { pool, closePool } from './pg-db';
import {
  findMany, findUnique, findFirst, create, update, del, deleteMany, count,
} from './dao';

/**
 * Connect to PostgreSQL. pg connects lazily on first query, so this just
 * validates that DATABASE_URL is set. Data routes fail closed with 503 when
 * DATABASE_URL is absent.
 */
export async function connectDb(): Promise<void> {
  if (!env.DATABASE_URL) {
    logger.warn('running without persistence', {
      detail: 'DATABASE_URL not set; API data routes answer 503.',
    });
    return;
  }
  logger.info('database connected', { database: 'postgresql' });
}

/** Disconnect the pool. */
export async function disconnectDb(): Promise<void> {
  await closePool();
}

export { pool, findMany, findUnique, findFirst, create, update, del, deleteMany, count };
