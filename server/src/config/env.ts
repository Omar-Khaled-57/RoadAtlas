import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
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

    if (values.NODE_ENV === 'production') {
      for (const key of ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH'] as const) {
        if (!values[key]) {
          context.addIssue({ code: 'custom', path: [key], message: 'Required in production.' });
        }
      }
    }
  });

const parsed = schema.parse(process.env);

export const env = parsed;
export const hasDb = Boolean(parsed.MONGODB_URI);
