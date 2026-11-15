# GOTCHAS.md — the traps we hit and the fixes

Read this before writing new code touching the DB, webhooks, queues, or
anything with "tenant" in its name. Every one of these ate real time this
session.

## Postgres & RLS

### 1. The app DB role MUST NOT be SUPERUSER
Superusers bypass RLS silently. During Phase D we had `annexevoice` as a
superuser; tenant A was reading tenant B rows from `/v1/customers`. Fix:
```sql
ALTER USER annexevoice NOSUPERUSER;
GRANT USAGE ON SCHEMA public TO annexevoice;
GRANT ALL ON ALL TABLES IN SCHEMA public TO annexevoice;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO annexevoice;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO annexevoice;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO annexevoice;
```
For local dev, also `ALTER USER annexevoice CREATEDB;` so `prisma migrate dev`
can make its shadow database.

### 2. Column names in RLS SQL must match Prisma's casing
Prisma uses camelCase in Postgres (`"tenantId"`, `"invoiceId"`,
`"nextNumber"`). Raw SQL **must** quote them. Unquoted `tenant_id` → "column
does not exist".

### 3. Writing under RLS without a scope will silently drop rows
`this.prisma.X.create()` outside `TenantScope.run(...)` → "new row violates
row-level security policy". Always use `scope.run(tenantId, async tx => …)`.
The few places that genuinely can't know the tenant yet (webhook signature
verification) look up metadata OUTSIDE scope and then enter scope to write.

### 4. `tenants.findUnique({ where: { id } })` behind RLS returns null
If the only reason you were looking up the tenant was to use its `id`,
just use the id you already have. The tenants table is RLS-protected and
returns null without a scope.

### 5. Admin bypass needs the GUC, not BYPASSRLS
We kept the app role without BYPASSRLS and taught the policies about
`is_admin_scope()`:
```sql
USING (is_admin_scope() OR "tenantId" = current_tenant_id())
```
`TenantScope.runAsAdmin` sets `app.is_admin='true'` in the transaction. The
only place that calls it is the `admin` module, which is gated by
`@Roles('ADMIN')`.

### 6. RLS file idempotency
`apply-rls.mjs` must be safe to re-run. Use `DROP POLICY IF EXISTS ... ;
CREATE POLICY ...` around every policy. Our tokenizer strips `--` comments
before splitting on `;` so a leading comment doesn't eat the next
statement.

## NestJS

### 7. `rawBody: true` on NestFactory.create — or webhooks can't verify
```ts
const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
```
Without it `req.rawBody` is undefined and any re-serialized body computes a
different HMAC. All our webhook signature checks depend on this.

### 8. `BigInt` can't be JSON.stringified
Prisma returns BigInt for numeric columns; Express's JSON serializer blows
up. `BigIntSerializerInterceptor` is globally registered in `main.ts`.
Make sure new modules don't bypass it.

### 9. `class-validator` runs BEFORE `class-transformer` `@Transform`
A DTO with `@IsInt() @Transform(({value}) => BigInt(value))` fails validation
on every payload — `IsInt` sees the raw `number`, succeeds, then
`Transform` makes it BigInt, which the **next** `IsInt` call (on the service
input) would reject. The pattern we use: validate as `number` at the edge,
convert to BigInt in the controller before calling the service.

### 10. Prisma UUID validation on `actorUserId`
`actorUserId: string | null` — pass `null` for machine actors
(`'public-api'`, `'worker'`) or Prisma's UUID validator rejects them.
Audit writes silently fail inside a transaction, so the whole request 500s.

## BullMQ

### 11. Job IDs cannot contain `:`
`submit:<id>` → "Custom Id cannot contain :". Use `-`: `submit-<id>`.

### 12. Workers need their own tenant scope
Processors receive `{tenantId, …}` in job data; wrap every DB touch in
`WorkerTenantScope.run(tenantId, …)`. No scope → "not found" → retry →
exponential backoff → DLQ.

## Build / TypeScript

### 13. `noUncheckedIndexedAccess` destructuring
`const [whole, fraction = ''] = s.split('.')` → `whole` is `string | undefined`,
even with a default on the second element. Narrow with
`parts[0] ?? '0'`.

### 14. `.ts` vs `.tsx` matters
`routeTree.ts` that returns `<Outlet />` must be `routeTree.tsx` or tsc
throws `TS1005: '>' expected`.

### 15. tax-engine must be CommonJS for the API
API's `tsconfig.nest.json` targets CommonJS; it `require()`s the engine. The
engine's `package.json` `"exports"` field must include `require`.

### 16. vite/client types
Both frontends need `src/vite-env.d.ts` with `/// <reference types="vite/client" />`
or `import.meta.env.VITE_*` fails to typecheck.

## Prisma

### 17. `prisma migrate dev` needs CREATEDB
To create the shadow database. In production use `prisma migrate deploy`
instead (no shadow DB needed).

### 18. JSON columns want `Prisma.InputJsonValue`
Casting `Record<string, unknown>` to it: `config as Prisma.InputJsonValue`.

### 19. The `?schema=public` in DATABASE_URL
Prisma understands it; `psql` does not. In scripts that hand the URL to
`psql`, strip the query first. Our `apply-rls.mjs` uses the Prisma client,
which avoids this.

## Running locally

### 20. Both Postgres and Redis must be up before the worker starts
The worker's Prisma client crashes on connect, not on first query. An
unavailable DB means the whole process exits with code 1.

### 21. A stale node process holds port 3000
After every rebuild do `pkill -f 'node dist'` before relaunching, or run on a
different port.

### 22. `dump.rdb` and `.tsbuildinfo` are gitignored
They were committed once in Phase C, then cleaned up in Phase D. Don't
re-add them.
