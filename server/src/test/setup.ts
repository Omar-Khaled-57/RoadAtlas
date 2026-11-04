import { afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

/**
 * Test bootstrap. Runs before the server modules are imported, so the environment
 * and the database are in place before `config/env` reads `process.env`.
 *
 * Requires a PostgreSQL database at DATABASE_URL (set in the environment or
 * .env.local). Without it, DB-dependent tests will fail to connect.
 */

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough-32';
process.env.ADMIN_EMAIL = 'owner@example.com';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-horse-battery-staple', 10);
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/roadatlas_test';
// Keep test output readable; failures still log at warn/error.
process.env.LOG_LEVEL = 'warn';

export const db = new PrismaClient();

afterAll(async () => {
  await db.$disconnect();
});
