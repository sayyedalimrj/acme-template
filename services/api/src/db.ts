/**
 * Postgres connection pool + a tiny typed query helper.
 */
import { Pool, type QueryResultRow } from 'pg';

import { env, isProduction } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Managed Postgres providers usually require TLS in production.
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Surface (but never crash on) idle client errors.
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] idle client error:', err.message);
});

/** Run a parameterized query and return the rows (typed by the caller). */
export async function query<T extends QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

/** Run a query expecting at most one row. */
export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
