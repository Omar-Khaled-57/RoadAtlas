import { Pool } from 'pg';

/** PostgreSQL connection pool. Reads DATABASE_URL from the environment. */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/** Run a query and return all rows. */
export async function query(text: string, params?: unknown[]): Promise<unknown[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Run a query and return the first row, or null. */
export async function queryOne(text: string, params?: unknown[]): Promise<unknown | null> {
  const result = await pool.query(text, params);
  return result.rows[0] ?? null;
}

/** Run a query and return the number of affected rows. */
export async function exec(text: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}

/** Close the pool (used during shutdown). */
export async function closePool(): Promise<void> {
  await pool.end().catch(() => {
    // ignore close errors
  });
}
