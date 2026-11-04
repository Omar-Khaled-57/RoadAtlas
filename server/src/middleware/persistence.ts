import type { RequestHandler } from 'express';
import { hasDb } from '../config/env';
import { unavailable } from '../lib/api-error';

/**
 * Data routes need a live database. Without one the API fails closed with a
 * clear message instead of hanging on a connection that will never be
 * established. Prisma connects lazily on first query, so a configured-but
 * unreachable database will surface as a query error rather than an opaque 500.
 */
export const requirePersistence: RequestHandler = (_req, _res, next) => {
  if (!hasDb) {
    next(unavailable('Persistence is not configured on this server.'));
    return;
  }

  next();
};
