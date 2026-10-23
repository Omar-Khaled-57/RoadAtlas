import type { Response } from 'express';
import { unauthorized } from './api-error';

export type ReadScope = 'public' | 'owner';

/** The authenticated owner, derived from the verified session. */
export function callerId(res: Response): string {
  const ownerId = res.locals.ownerId as string | undefined;
  if (!ownerId) throw unauthorized();
  return ownerId;
}

export function optionalCallerId(res: Response): string | undefined {
  return res.locals.ownerId as string | undefined;
}

/**
 * `public` returns explicitly published records only.
 * `owner` returns the caller's own records (both visibilities) and needs a session.
 */
export function scopeFilter(
  scope: ReadScope,
  ownerId: string | undefined,
): Record<string, unknown> {
  if (scope === 'owner') {
    if (!ownerId) throw unauthorized();
    return { ownerId };
  }
  return { visibility: 'public' };
}

/** Public records are readable by anyone; private records only by their owner. */
export function isReadable(
  doc: { visibility?: unknown; ownerId?: unknown },
  ownerId: string | undefined,
): boolean {
  if (doc.visibility === 'public') return true;
  return Boolean(ownerId) && String(doc.ownerId) === ownerId;
}
