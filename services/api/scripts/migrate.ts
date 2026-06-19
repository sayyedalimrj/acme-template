/**
 * Minimal migration runner: applies db/schema.sql (and db/seed.sql with `--seed`).
 *
 * Usage:
 *   npm run migrate        # create/upgrade the schema (idempotent: IF NOT EXISTS)
 *   npm run seed           # schema + demo data
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Pool } from 'pg';

import { env, isProduction } from '../src/env';

async function main(): Promise<void> {
  const withSeed = process.argv.includes('--seed');
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  const schema = readFileSync(resolve(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  // eslint-disable-next-line no-console
  console.log('[migrate] applying schema…');
  await pool.query(schema);

  if (withSeed) {
    const seed = readFileSync(resolve(__dirname, '..', 'db', 'seed.sql'), 'utf8');
    // eslint-disable-next-line no-console
    console.log('[migrate] applying seed…');
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
