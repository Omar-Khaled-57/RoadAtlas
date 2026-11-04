import type { Request, Response } from 'express';
import { createApp } from './app';
import { connectDb } from './db/connect';

/** Vercel augments the Node request with parsed query values. */
type VercelRequest = Request & {
  query?: Record<string, string | string[]>;
};

const app = createApp();

/**
 * Vercel entry point. The catch-all function receives paths such as
 * `/api/roadmaps`; Express expects to see that same prefix, so normalize the
 * URL for both `/api` and `/api/*` invocations.
 */
export default async function handler(req: VercelRequest, res: Response): Promise<void> {
  try {
    await connectDb();
  } catch {
    // Health still answers; data routes fail closed via requirePersistence.
  }

  const raw = req.url ?? '/api';
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  const rawPath = raw.split('?')[0] ?? '';

  const segments = req.query?.path;
  let suffix = Array.isArray(segments) ? segments.join('/') : (segments ?? '');

  // Some runtimes strip the function prefix; keep the original path if so.
  if (!suffix && rawPath.startsWith('/api/')) suffix = rawPath.slice('/api/'.length);
  if (suffix === 'index') suffix = '';

  req.url = `/api${suffix ? `/${suffix}` : ''}${search}`;
  app(req, res);
}
