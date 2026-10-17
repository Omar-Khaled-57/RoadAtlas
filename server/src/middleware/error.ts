import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '@shared/index';
import { env } from '../config/env';

interface StatusError extends Error {
  status?: number;
  statusCode?: number;
}

export function notFound(req: Request, res: Response): void {
  const body: ApiError = { message: `Not found: ${req.method} ${req.originalUrl}` };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = (err as StatusError)?.status ?? (err as StatusError)?.statusCode ?? 500;
  const message =
    status >= 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error';

  console.error('[error]', err);
  const body: ApiError = { message };
  res.status(status).json(body);
}
