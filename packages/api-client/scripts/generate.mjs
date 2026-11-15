#!/usr/bin/env node
// Fetches the running API's OpenAPI spec and regenerates the typed client schema.
// Usage: pnpm --filter @annexevoice/api-client generate
//        (requires the API to be running at API_BASE_URL, defaults to localhost:3000)

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.env.API_BASE_URL ?? 'http://localhost:3000';
const specUrl = `${base.replace(/\/$/, '')}/openapi.json`;
const out = resolve(here, '..', 'src', 'generated', 'schema.ts');

console.log(`Fetching OpenAPI spec from ${specUrl}`);
const ast = await openapiTS(specUrl);
// No timestamp or URL: CI's openapi-drift job diffs this file, so output must be deterministic.
const banner = '// Generated from the API\'s /openapi.json by `pnpm api:generate`. Do not edit by hand.\n';
await writeFile(out, banner + astToString(ast));
console.log(`Wrote ${out}`);
