/**
 * Ordered, tracked migration runner.
 *
 * Applies every `db/migrations/NNN_*.sql` file in ascending order exactly once, recording
 * applied versions in a `schema_migrations` table. Re-running is safe (idempotent): already
 * applied files are skipped. Each file runs inside a transaction.
 *
 * Usage:
 *   npm run migrate           # apply pending migrations
 *   npm run migrate -- --seed # apply migrations, then dev seed (BLOCKED in production)
 *   npm run seed              # alias of the above
 *
 * Rollback: see db/migrations/ROLLBACK.md (we deliberately do not auto-run destructive down
 * migrations against a live database).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Pool } from 'pg';

import { env, isProduction } from '../src/env';

const MIGRATIONS_DIR = resolve(__dirname, '..', 'db', 'migrations');
const SEED_FILE = resolve(__dirname, '..', 'db', 'seed.sql');

async function main(): Promise<void> {
  const withSeed = process.argv.includes('--seed');
  if (withSeed && isProduction) {
    // eslint-disable-next-line no-console
    console.error('[migrate] refusing to apply dev seed in production (NODE_ENV=production).');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const applied = new Set(
    (await pool.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map(
      (r) => r.version,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // eslint-disable-next-line no-console
      console.log(`[migrate] applying ${file}…`);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
      appliedCount += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    appliedCount > 0
      ? `[migrate] applied ${appliedCount} migration(s).`
      : '[migrate] up to date (nothing to apply).',
  );

  if (withSeed) {
    const seed = readFileSync(SEED_FILE, 'utf8');
    // eslint-disable-next-line no-console
    console.log('[migrate] applying dev seed…');
    await pool.query(seed);
  }

  await pool.end();
  // eslint-disable-next-line no-console
  console.log('[migrate] done.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[migrate] failed:', err);
  process.exit(1);
});
