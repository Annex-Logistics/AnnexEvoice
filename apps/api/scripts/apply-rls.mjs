#!/usr/bin/env node
// Applies RLS policies defined in prisma/rls.sql using psql.
// Runs after prisma migrate.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const rlsPath = resolve(here, '..', 'prisma', 'rls.sql');
const sql = readFileSync(rlsPath, 'utf8');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// psql doesn't accept Prisma's ?schema=foo query param — strip it.
const psqlUrl = url.replace(/[?&]schema=[^&]*/g, '');

const result = spawnSync('psql', [psqlUrl, '-v', 'ON_ERROR_STOP=1', '-f', rlsPath], {
  stdio: 'inherit',
  env: { ...process.env, PGCONNECT_TIMEOUT: '10' },
});

if (result.status !== 0) {
  console.error('psql exited with status', result.status);
  process.exit(result.status ?? 1);
}
console.log('RLS policies applied.');
