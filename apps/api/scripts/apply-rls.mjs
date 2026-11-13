#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const rlsSql = await readFile(resolve(here, '..', 'prisma', 'rls.sql'), 'utf8');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query(rlsSql);
  console.log('RLS policies applied.');
} finally {
  await client.end();
}
