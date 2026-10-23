import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { forbidden } from '../lib/api-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * State-changing API calls must come from the configured client origin. The session
 * cookie is `SameSite=None` in production so the SPA can live on another origin;
 * without this check a third-party page could drive the owner's session.
 */
export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');
  if (!origin || origin !== env.CLIENT_ORIGIN) {
    next(forbidden('Request origin is not allowed.'));
    return;
  }

  next();
};
