import { afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

/**
 * Test bootstrap. Requires a PostgreSQL database at DATABASE_URL.
 * Runs the schema SQL to create tables before tests.
 */

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough-32';
process.env.ADMIN_EMAIL = 'owner@example.com';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-horse-battery-staple', 10);
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/roadatlas_test';
process.env.LOG_LEVEL = 'warn';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});
