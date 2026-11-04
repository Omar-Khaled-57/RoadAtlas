import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { hasDb } from '../config/env';
import { unavailable } from '../lib/api-error';

/**
 * Data routes need a live database. Without one the API fails closed with a
 * clear message instead of hanging on a connection that will never be
 * established. A configured-but-unreachable database also answers 503 rather
 * than surfacing a driver timeout as an opaque 500.
 */
export const requirePersistence: RequestHandler = (_req, _res, next) => {
  if (!hasDb) {
    next(unavailable('Persistence is not configured on this server.'));
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    next(unavailable('The database is not reachable right now.'));
    return;
  }

  next();
};
