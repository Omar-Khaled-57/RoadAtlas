import type { ZodType } from 'zod';
import { badRequest } from './api-error';

/** Parse at the API boundary; a malformed request never reaches the database. */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest(
      'Validation failed.',
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}
