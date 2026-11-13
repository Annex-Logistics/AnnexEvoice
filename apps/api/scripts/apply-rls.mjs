#!/usr/bin/env node
// Applies RLS policies defined in prisma/rls.sql using Prisma's own connection
// (no psql dependency, so this works in minimal containers).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
const rawSql = readFileSync(resolve(here, '..', 'prisma', 'rls.sql'), 'utf8');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Strip line comments (-- …) that sit outside $$-quoted bodies. We split on
// newlines, drop anything after a line-leading '--', then rejoin.
function stripComments(input) {
  const lines = input.split('\n');
  const out = [];
  let inDollar = false;
  for (const raw of lines) {
    // Track $$ opens/closes line-by-line. The rls.sql never has two $$ markers
    // on the same line, so a per-line count is enough.
    const count = (raw.match(/\$\$/g) ?? []).length;
    const originalInDollar = inDollar;
    if (count % 2 === 1) inDollar = !inDollar;
    if (originalInDollar) {
      out.push(raw);
      continue;
    }
    const trimmed = raw.trimStart();
    if (trimmed.startsWith('--')) continue;
    // Strip trailing -- comments too (naïve but fine for our file).
    const idx = raw.indexOf('--');
    out.push(idx >= 0 ? raw.slice(0, idx) : raw);
  }
  return out.join('\n');
}

// Split on semicolons not inside a $$ block.
function splitStatements(input) {
  const out = [];
  let buf = '';
  let inDollar = false;
  for (let i = 0; i < input.length; i += 1) {
    const two = input.slice(i, i + 2);
    if (two === '$$') {
      inDollar = !inDollar;
      buf += two;
      i += 1;
      continue;
    }
    const ch = input[i];
    if (ch === ';' && !inDollar) {
      const stmt = buf.trim();
      if (stmt.length > 0) out.push(stmt);
      buf = '';
    } else {
      buf += ch;
    }
  }
  const tail = buf.trim();
  if (tail.length > 0) out.push(tail);
  return out;
}

const prisma = new PrismaClient();

try {
  const statements = splitStatements(stripComments(rawSql));
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log(`RLS policies applied (${statements.length} statements).`);
} catch (err) {
  console.error('Failed to apply RLS:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
