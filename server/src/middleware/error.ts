import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '@shared/index';
import { env } from '../config/env';
import { ApiError as ApiFailure } from '../lib/api-error';
import { logger } from '../lib/logger';

interface StatusError extends Error {
  status?: number;
  statusCode?: number;
}

function requestIdOf(res: Response): string | undefined {
  const value: unknown = res.locals.requestId;
  return typeof value === 'string' ? value : undefined;
}

function errorFields(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { value: err };
}

export function notFound(req: Request, res: Response): void {
  const requestId = requestIdOf(res);
  const body: ApiError = {
    message: `Not found: ${req.method} ${req.originalUrl}`,
    ...(requestId ? { requestId } : {}),
  };
  res.status(404).json(body);
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  // If the response already started, delegate to Express' default handler to avoid
  // a double-send (which would crash the request).
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = requestIdOf(res);

  // Intentional failures carry a safe, client-facing message.
  if (err instanceof ApiFailure) {
    const body: ApiError = {
      message: err.message,
      ...(err.details === undefined ? {} : { details: err.details }),
      ...(requestId ? { requestId } : {}),
    };
    res.status(err.status).json(body);
    return;
  }

  const status = (err as StatusError)?.status ?? (err as StatusError)?.statusCode ?? 500;
  const message =
    status >= 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error';

  logger.error('request failed', { requestId, status, ...errorFields(err) });

  const body: ApiError = { message, ...(requestId ? { requestId } : {}) };
  res.status(status).json(body);
}
