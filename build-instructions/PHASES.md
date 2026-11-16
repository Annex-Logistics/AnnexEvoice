# PHASES.md — detailed per-phase log

Every phase is one git commit. Hash, title, what we built, what we learned.

---

## Phase 0 — Initial scaffold · `0ded90a`
**Scope.** The whole file tree the prompt asks for: pnpm workspaces,
Turborepo, 4 apps, 4 packages, infra, docs, runbooks, CI workflows, Prisma
schema, RLS SQL, seed, tests folder, DEV env.

**Delivered.** 221 files / 8,680 insertions.
- Phase 1 pack: README, roadmap, architecture, decisions (10 ADRs), changelog,
  build-prompt; docs/architecture/* (C4 context, container, ERD, 3 sequences);
  docs/runbooks/* (deploy, rollback, restore, rotate-secrets,
  onboard-app-provider, incident-response).
- Prisma schema covering every entity in architecture.md.
- Every NestJS module with mocks for every external provider.
- Infra: Terraform, Caddy, docker-compose dev and prod, backup script,
  VM bootstrap.
- CI: lint/typecheck/test + staging and prod deploy via WIF+IAP.
- Rebrand: Invoiq → AnnexEvoice everywhere.

**Learned.** Nothing — this was pure creation.

---

## Phase B — tax-engine · `23a6a28`
**Scope.** Build + unit test the pure-TS VAT/WHT engine.

**Delivered.**
- Fixed `src/money.ts` destructuring under `noUncheckedIndexedAccess`.
- Fixed the half-up rounding boundary test (`1340 * 750 / 10000` is exactly
  the halfway point, not `1334`).
- Vitest coverage scoped to real logic files (not re-exports).

**Learned.** `strict` + `noUncheckedIndexedAccess` makes `split('.')`
destructuring return `string | undefined`. Narrow explicitly.

**Result.** 13/13 tests pass, 96% stmt coverage.

---

## Phase C — all apps compile · `721c17c`
**Scope.** Get `pnpm build` and `pnpm typecheck` green across api, worker,
web, admin.

**Delivered.**
- `integrations.service.ts` casts `Record<string, unknown>` through
  `Prisma.InputJsonValue` for the JSON column type.
- worker gained missing `@nestjs/schedule` dependency.
- Both frontends get `src/vite-env.d.ts` with `/// <reference types="vite/client" />`
  so `ImportMeta.env` typechecks.
- `apps/web/src/routeTree.ts` renamed to `.tsx` (it contains JSX).
- Web pages dropped the openapi-fetch typed client (still a stub) for a tiny
  `apiGet/apiPost` wrapper. The typed client stays in `packages/api-client`.

**Learned.** The openapi-fetch typed client collapses to `undefined` when the
generated `paths` type is `Record<string, unknown>`; its calls can't be
awaited into nice types until the schema is real.

**Result.** Web bundle 331 KB / 105 KB gzip; admin 270 KB / 84 KB gzip.

---

## Phase D — live API + RLS · `728bcb7`
**Scope.** Boot the API, connect to Postgres + Redis, prove tenant isolation.

**Delivered.**
- Initial Prisma migration committed (`20261113190521_init/migration.sql`).
- RLS policies rewritten to Prisma's camelCase column names
  (`"tenantId"`, `"invoiceId"`, `"nextNumber"`).
- `scripts/apply-rls.mjs` initially via psql.
- tax-engine recompiled to **CommonJS** (API couldn't `require` ESM).
- `main.ts` globally installs `BigIntSerializerInterceptor` and
  `AllExceptionsFilter`.
- Invoice create DTO accepts `unitPriceKobo` as number; controller converts
  to `BigInt` before calling the service. Reason: `class-validator`
  `@IsInt` runs BEFORE `class-transformer` `@Transform`, so a validator sitting
  on top of a BigInt-transforming field rejects every valid payload.
- Invoice-sequence raw SQL uses `"tenantId"`/`"nextNumber"`.
- BullMQ job id now `submit-<id>` (not `submit:<id>` — colons are forbidden).

**Learned.**
- `annexevoice` DB role must **NOT** be SUPERUSER. Superusers silently bypass
  RLS, so tenant A was seeing tenant B rows. `ALTER USER annexevoice NOSUPERUSER;`
  then grant the needed privileges.
- `PII_ENCRYPTION_KEY` must decode to exactly 32 bytes base64.

**Result.** 37 OpenAPI paths exposed, all endpoints verified against a
running stack.

---

## Phase E — worker transmits · `59c58f2`
**Scope.** Prove the invoice → mock APP flow works through BullMQ.

**Delivered.**
- `WorkerTenantScope` — the worker's equivalent of `TenantScope`. Every
  processor runs inside `scope.run(tenantId, async tx => …)`.
- `EInvoiceSubmitProcessor` rewritten to do its single transaction under
  tenant scope, stamp a deterministic MOCK IRN from the idempotency key, and
  write `invoice.transmitted` to the audit log.

**Learned.** Without a tenant scope, the worker's Prisma calls return 0 rows
and the job fails with "Invoice not found". Pass `tenantId` in the job data
and set it on the GUC before the first query.

**Result.** `INV-000003 → MOCK-4CEDAF2E-INV-000003`, submission goes
PENDING → SUCCEEDED.

---

## Phase F — Paystack webhook + reconcile · `6f87dee`
**Scope.** Sign, verify, record, and reconcile a payment webhook.

**Delivered.**
- `NestFactory.create({ rawBody: true })` — without it, express had already
  re-serialized the body by the time the controller read it, and no HMAC
  matched.
- `PaymentsService.recordWebhookPayment` uses `scope.run(tenantId, …)` (not
  `runAsAdmin`). The webhook metadata carries the tenant.
- `enqueueReconciliation(paymentId, tenantId)` passes tenantId so the worker
  processor can enter the right RLS scope.
- `PaymentReconcileProcessor` inside a single tenant-scoped transaction.

**Learned.** `runAsAdmin` is useless when the DB role doesn't have BYPASSRLS
and no is-admin GUC exists yet. The right fix is either the GUC (Phase M) or
scope.run with a known tenantId.

**Result.** Invoice INV-000003 PAID 1,075,000/1,075,000; bad sig returns 400.

---

## Phase G — WhatsApp inbound · `b79222a`
**Scope.** Sign-verify a Meta Cloud API webhook, parse the message, draft an
invoice.

**Delivered.**
- `ingestWebhook` wraps every message insert in `TenantScope.run`.
- `resolveTenantByPhone` tries both `phone` and `+phone` (Meta sends no `+`)
  and returns the membership's `tenantId` directly — it does NOT call
  `tenants.findUnique`, which sits behind RLS and would return null.
- `WhatsappInboundProcessor` under `WorkerTenantScope`; drafts an invoice
  from the message body in one transaction.
- `audit_events` gets `invoice.drafted.whatsapp`.

**Learned.** Looking up a tenant by id behind RLS without a scope returns
null. If all you need is the id (which you already have), skip the lookup.

**Result.** WhatsApp message → draft invoice CN-NNNNNN with correct VAT.

---

## Phase H — smoke test + RLS proof · `a6f8284`
**Scope.** Codify what we'd been proving manually.

**Delivered.**
- `scripts/smoke.sh` — 10 initial checks via `curl` and `jq` under 2 s.
- `scripts/verify-rls-isolation.sql` — four proofs against the app role:
  no scope → 0 rows, Acme scope → only Acme rows, Baobab scope → only
  Baobab rows, cross-tenant INSERT rejected.
- Audit event counts captured in the commit message.

---

## Phase I — portable RLS applier · `5479c8a`
**Scope.** Make `node apps/api/scripts/apply-rls.mjs` work in minimal
containers (no psql, no superuser).

**Delivered.**
- `apply-rls.mjs` uses Prisma's own `$executeRawUnsafe`.
- A tiny tokenizer splits top-level semicolons while tracking `$$`
  dollar-quoted bodies and strips `--` comments before splitting (a comment
  at the start of a statement buffer used to eat the whole statement).
- `rls.sql` no longer runs `ALTER ROLE app_admin BYPASSRLS;` — that
  requires superuser and is a one-time DBA note at the bottom of the file.

**Learned.** The migration pipeline must be idempotent and must assume no
elevated database privileges. Push the superuser-only things to a human
runbook step.

**Result.** 21 policies across all tenant-scoped tables, idempotent, smoke
still passes afterwards.

---

## `docs/DEVELOPMENT.md` · `1f137f7`
Not a phase, but the gotchas doc every new contributor needs. Contains the
"Why not superuser" section, the full curl smoke recipes, and every trap
this session hit.

---

## Phase K — public API with API keys · `48faa2a`
**Scope.** Partner/ERP access via `x-api-key`.

**Delivered.**
- New Prisma model `ApiKey` with `keyHash` (sha256 of plaintext), `tenantId`,
  `name`, `createdByUser`, `lastUsedAt`, `revokedAt`. RLS intentionally OFF
  on this table because the guard has to look up the tenant BEFORE any
  tenant context exists.
- Migration `20261113205813_add_api_keys`.
- `PublicApiService.issueKey` → returns the plaintext exactly once
  (`anvx_<24 random bytes b64url>`).
- `PublicApiService.resolveTenantByKey` → used by `ApiKeyGuard`, bumps
  `lastUsedAt` async.
- `ApiKeysController` on JWT auth; `PublicApiController` on API-key auth.
- `InvoicesService` methods now take `actorUserId: string | null` — machine
  actors (`public-api`, worker) pass null so audit rows don't blow up on
  UUID validation.

**Learned.** Prisma's UUID validator will reject `"public-api"` even on a
nullable column if you pass a non-null non-UUID string.

**Result.** 6 live checks: mint, list, use, bad-key 401, create invoice,
lastUsedAt stamped.

---

## Phase L — credit notes + immutability · `17200bf`
**Scope.** The official correction mechanism, and proof that transmitted
invoices are locked.

**Delivered.**
- `CreditNotesService.create` only accepts TRANSMITTED/PART_PAID/PAID
  invoices, rejects totalKobo > invoice.totalKobo, allocates CN-NNNNNN
  numbers from the same tenant sequence table, writes
  `credit-note.issued` audit events.
- `InvoiceNumberService.nextCreditNoteNumber` added; both prefixes share the
  gapless per-tenant sequence.
- `CreditNotesController` on JWT auth.

**Result.** 6 live checks: cancel transmitted → 409, create valid CN,
reject over-total, reject against draft, list CNs, audit row present.

---

## Phase M — admin cross-tenant · `7f2571a`
**Scope.** Make the `/v1/admin/*` endpoints actually see across tenants
without giving the application DB role BYPASSRLS.

**Delivered.**
- New SQL function `is_admin_scope()` reading `current_setting('app.is_admin', true)`.
- Every RLS policy now
  `USING (is_admin_scope() OR "tenantId" = current_tenant_id())`.
- `TenantScope.runAsAdmin` sets both `app.tenant_id=''` and
  `app.is_admin='true'` inside its transaction.
- Seed script output noted: promote the Acme owner to ADMIN role for
  testing.

**Verified.**
- JWT role ADMIN → `/v1/admin/tenants` returns both tenants.
- JWT role ACCOUNTANT → 403.

---

## Phase N — smoke expanded · `ad46ffa`
**Scope.** Cover the new surfaces from phases K/L/M.

**Delivered.** `scripts/smoke.sh` now runs 18 checks across:
1. `/health`, `/health/ready`
2. OTP auth
3. `/tenants/me`
4. Draft invoice + VAT math
5. Issue + INV-NNNNNN number
6. Immutability (cancel transmitted → 409)
7. Credit note create + over-total rejection
8. Public API: mint anvx_ key, list, bad key 401
9. Admin: cross-tenant view, integrations/health
10. Webhook sig: Paystack bad → 400, WhatsApp verify handshake

---

## Phase O — whole repo green · `a5e1f76`
**Scope.** `pnpm build && pnpm typecheck && pnpm test && scripts/smoke.sh`
all green on one machine.

**Delivered.**
- `apps/api`, `apps/worker`, `apps/web` vitest invocations use
  `--passWithNoTests`.
- `tests/e2e/package.json` splits `test` (no-op stub) from `test:e2e` (real
  playwright) so default CI doesn't need a running server.

**Result.**
```
pnpm build        5/5
pnpm typecheck    9/9
pnpm test         6/6
scripts/smoke.sh  18/18
```

---

## Phase P — review fixes + real OpenAPI client (session 2, 2026-11-15)
**Scope.** Re-verify the handoff on a fresh Windows machine, fix what broke,
then NEXT #1.

**Review findings fixed.**
- `pnpm lint` failed in every package: ESLint 9 ignores `.eslintrc.cjs`.
  Migrated to `eslint.config.mjs` (flat config); dropped `--ext`.
- `RESUME.md` skipped the superuser `CREATE ROLE app_admin` step, so
  `apply-rls.mjs` fails on a fresh DB.
- `apps/web` crashed on boot: shell layout and dashboard both had path `/`
  ("Duplicate routes found with id: /"). Shell is now a pathless layout.
- Every web page and the admin console called `/customers`, `/admin/...`
  etc. without the `/v1` prefix, so all requests 404'd.
- API `start`/`start:prod` and `infra/docker/api.Dockerfile` ran
  `dist/main.js`; the build emits `dist/src/main.js`.
- CI `openapi-drift` could never detect drift: no Postgres/Redis services, no
  `prisma generate`, `|| true` swallowed failures, and the generated banner
  had a timestamp.

**Delivered (NEXT #1).**
- `@nestjs/swagger` CLI plugin enabled (`classValidatorShim`, and
  `.controller.ts` added to `dtoFileNameSuffix` because DTOs live inline in
  controllers) — request bodies now have real schemas.
- `apps/api/src/common/openapi-responses.ts`: response schemas for auth,
  tenants/me, tax/summary, customers, products, invoices (list/detail/create/
  issue/cancel). Kobo fields are `string` (BigInt interceptor).
- `packages/api-client/src/generated/schema.ts` generated from the live API;
  deterministic banner.
- `apps/web` uses `createAnnexEvoiceClient` + `unwrap()`; hand-written
  response types deleted. Verified in the browser: dashboard, invoices,
  invoice detail, customers, products, settings all render live data.

**Not typed yet.** Admin, audit, billing, payments, credit-notes,
integrations, einvoice, public-api responses — their `data` is `never`
until response schemas are added (do it alongside NEXT #10 admin UI).

---

## Phase P3 — real PDF rendering (session 2, 2026-11-16)
**Scope.** NEXT #2.

**Delivered.**
- `apps/worker/src/pdf/pdf-renderer.service.ts`: single shared Playwright
  Chromium process (lazy-launched, torn down in `onModuleDestroy`). JS
  disabled in the context; every network request is aborted unless the URL
  starts with `data:`, so customer-supplied strings can never make Chromium
  fetch a remote resource. A4, 16/14mm margins, `printBackground`.
- `apps/worker/src/storage/`: `StorageProvider` interface + `MockStorageProvider`
  (writes under `STORAGE_LOCAL_DIR`, returns `file://` URLs; path-escape
  guard) + `GcsStorageProvider` stub that throws. Selected by
  `STORAGE_PROVIDER` in `WorkerModule`.
- `apps/worker/src/processors/pdf-render.processor.ts` rewritten: reads
  invoice under `WorkerTenantScope.run`, renders *outside* the DB
  transaction (so Chromium doesn't hold Postgres open), stores
  `{tenantId}/{invoiceId}-{number}.pdf`, writes `invoice.pdfUrl` and an
  `invoice.pdf.rendered` audit row under scope, then enqueues notification
  jobs on `notifications` (one per channel the customer has — phone/email).
- `einvoice-submit` chains the PDF job AFTER the transaction commits (the
  `WorkerTenantScope` callback must return before the PDF job runs, or it
  reads a pre-TRANSMITTED row).
- `notifications` processor no longer logs the recipient (PII); logs the
  job id and attachment count instead.
- HTML template is self-contained, strict-escapes every string, shows WHT
  only when `whtKobo > 0`, uses `formatKoboAsNGN` from tax-engine, embeds
  the NRS QR as a data URL.
- `apps/worker/tsconfig.json`: excludes `*.spec.ts` — they were being
  compiled into `dist/`.
- `.env.example`: `STORAGE_LOCAL_DIR`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
  `.gitignore`: `.storage/`.
- Smoke test grows a "6b. worker: transmission + PDF" section (asserts
  TRANSMITTED+IRN and a non-null `pdfUrl` within 30 s — cold Chromium
  launch takes a few seconds).

**Verified.**
- Issued an invoice end-to-end; the worker rendered a 59 KB PDF to
  `C:/Users/Legal/tools/annexevoice-storage/.../INV-000005.pdf` within 3 s
  and set `invoice.pdfUrl`. Visually inspected the rendered PDF: header,
  parties, line table, subtotals, QR code and IRN all present; notes are
  HTML-escaped.
- `pnpm test`: 19/19 (was 16/16 — the 3 new ones are escape + currency
  format + conditional WHT line).
- `scripts/smoke.sh`: 22/22 (was 20/20).

---

## Not in this session
See `NEXT.md` for the ranked backlog.
