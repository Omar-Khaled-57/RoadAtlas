import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().url().optional(),
    MONGODB_URI: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  })
  .superRefine((values, context) => {
    if (values.JWT_SECRET && values.JWT_SECRET.length < 32) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'Must be at least 32 characters.',
      });
    }

    if (
      values.ADMIN_PASSWORD_HASH &&
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(values.ADMIN_PASSWORD_HASH)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_PASSWORD_HASH'],
        message: 'Must be a bcrypt password hash.',
      });
    }

    const adminPair = [values.ADMIN_EMAIL, values.ADMIN_PASSWORD_HASH];
    if (values.NODE_ENV === 'production' && adminPair.some(Boolean) && !adminPair.every(Boolean)) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_EMAIL'],
        message: 'Set both ADMIN_EMAIL and ADMIN_PASSWORD_HASH, or neither.',
      });
    }

    if (values.NODE_ENV === 'production') {
      for (const key of ['CLIENT_ORIGIN', 'JWT_SECRET'] as const) {
        if (!values[key]) {
          context.addIssue({ code: 'custom', path: [key], message: 'Required in production.' });
        }
      }

      // A missing MONGODB_URI is deliberately not fatal: the server boots, health
      // reports `database: "disabled"`, and data routes fail closed with 503 so
      // a misconfigured deployment stays diagnosable instead of returning a bare
      // function error on every request.
    }
  });

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  // Only reachable in development/test — production requires CLIENT_ORIGIN explicitly.
  CLIENT_ORIGIN: parsed.CLIENT_ORIGIN ?? 'http://localhost:5173',
};
export const hasDb = Boolean(parsed.MONGODB_URI);
