# SESSION.md — primary handoff

> **TL;DR.** The scaffold and the whole MVP flow is built and working on a local
> Postgres + Redis stack. All phases A–O are committed on `main`
> (`0ded90a` → `a5e1f76`). To resume, run the commands in `RESUME.md`, then
> pick an item from `NEXT.md`.

## What was built this session

Starting from an empty repository (`https://github.com/patricku-cpu/AnnexEvoice`),
this session built the full AnnexEvoice scaffold described in `docs/build-prompt.md`:

- **Architecture pack** — C4 context + container diagrams, ERD, three sequence
  diagrams (WhatsApp invoice, NRS retry, payment reconcile), 10 ADRs, 6
  runbooks.
- **Monorepo** — pnpm 9.12 + Turborepo 2, workspaces `apps/{api,worker,web,admin}`,
  packages `{config,tax-engine,ui,api-client}`, `tests/{e2e,load}`.
- **Data layer** — Prisma schema covering every entity in `architecture.md`,
  initial migration committed, RLS policies in SQL with an `is_admin_scope()`
  exception for the admin module, seed with two tenants.
- **API** (NestJS) — 17 modules: `auth` (OTP + password + refresh), `tenants`,
  `users`, `customers`, `products`, `tax`, `invoices`, `credit-notes`,
  `einvoice`, `payments`, `whatsapp`, `notifications`, `billing`,
  `integrations`, `audit`, `admin`, `public-api`, `health`.
  Swagger on `/docs`, OpenAPI at `/openapi.json`.
- **Worker** (NestJS BullMQ) — processors for `einvoice-submit`,
  `einvoice-reconcile`, `whatsapp-inbound`, `pdf-render`, `notifications`,
  `reminders`, `payment-reconcile`.
- **Provider adapters** — mock + marked-TODO real for every external system
  (NRS APP, Meta WhatsApp, Paystack, Flutterwave, Termii, Resend, Mono, KYC,
  GCS, QBO/Xero/Zoho/Sage, Anthropic). Mocks run the full flow without real
  credentials.
- **Frontends** — React 19 PWA (`apps/web`) with TanStack Router/Query +
  Tailwind + vite-plugin-pwa, and the admin console (`apps/admin`).
- **Infra** — Terraform (VPC, firewall allowing 80/443 and IAP SSH only,
  static IP, VM with cloud-init, GCS buckets, Artifact Registry,
  least-privilege IAM, weekly disk snapshots), Caddy config, production
  docker-compose, nightly pg_dump + age encryption backup script.
- **CI/CD** — GitHub Actions for lint/typecheck/test/OpenAPI drift on PRs,
  staging deploy on `main`, tagged production deploy with WIF auth and
  SSH-via-IAP rollback.

## Live-verified end-to-end

The following has been proven on this machine (Postgres 16 + Redis 7 running
locally):

1. **Auth** — OTP issue → verify → JWT access token with correct `tenantId`
   and `role`.
2. **RLS** — tenant A only sees tenant A rows; direct SQL proof in
   `scripts/verify-rls-isolation.sql`; attempts to insert a row with another
   tenant's id are rejected with "new row violates row-level security policy".
3. **Invoice lifecycle**
   - `POST /v1/invoices` → DRAFT with correct VAT (7.5%).
   - `POST /v1/invoices/:id/issue` → PENDING_TRANSMISSION, number assigned
     via gapless per-tenant sequence (INV-NNNNNN).
   - BullMQ `einvoice-submit` picked up by the worker → invoice becomes
     TRANSMITTED, mock IRN stamped (`MOCK-<sha8>-INV-NNNNNN`).
   - Cancelling a non-draft returns 409.
4. **Credit notes** — against TRANSMITTED/PAID invoices; rejected if
   totalKobo > invoice total or against a DRAFT; CN-NNNNNN number.
5. **Payments** — HMAC-SHA512-signed Paystack webhook (bad sig → 400) →
   payment row → `payment-reconcile` → invoice PAID, `audit_events`
   `payment.reconciled`.
6. **WhatsApp** — HMAC-SHA256 `x-hub-signature-256` Meta webhook; verify
   handshake returns challenge; `invoice Aisha Bello 20 cartons noodles @1850`
   is parsed by the rule-based grammar, a draft invoice is created with
   subtotal ₦37,000 / VAT ₦2,775 / total ₦39,775.
7. **Public API** — `POST /v1/api-keys` returns an `anvx_...` plaintext once;
   `x-api-key` header auth works against `/v1/public/invoices` CRUD; bad key
   → 401; `lastUsedAt` auto-stamped.
8. **Admin** — ADMIN role + `is_admin_scope()` lets `/v1/admin/tenants` see
   every tenant without the DB role needing BYPASSRLS; non-admin roles
   receive 403.
9. **Audit** — Every state change writes `audit_events`: `invoice.drafted`,
   `invoice.issued`, `invoice.transmitted`, `invoice.drafted.whatsapp`,
   `payment.reconciled`, `credit-note.issued`.

## Test results at the end of the session

```
pnpm build        5/5 tasks   (api, worker, web, admin, tax-engine)
pnpm typecheck    9/9 tasks
pnpm test         6/6 tasks   (tax-engine 13/13, api 3/3, rest pass-with-no-tests)
scripts/smoke.sh  18/18 checks
```

## Repo

- `main` on `https://github.com/patricku-cpu/AnnexEvoice`
- Commits `0ded90a` (initial scaffold) through `a5e1f76` (Phase O).
- `COMMITS.md` has the full list with one line of context per commit.

## Where to pick up

Read **`NEXT.md`** for the ranked backlog with context. Highest priority items:
1. Wire real OpenAPI generation in `packages/api-client` (CI step is there but
   the schema is still a stub).
2. Implement Playwright PDF rendering in the worker (the HTML template is
   written; it just hasn't been rendered yet).
3. Integration tests with Testcontainers Postgres + Redis — codify the smoke
   script as vitest tests so CI runs them automatically.
4. Credit-note NRS submission queue (parallels `einvoice-submit`).

## How we work

- Work in phases, each phase is one commit.
- End of every phase: run `pnpm build && pnpm test` and `scripts/smoke.sh`;
  commit only if green.
- Push after every phase.
- Any new adapter: interface + mock + real-TODO, selected by `*_PROVIDER` env.
- Any new table: add RLS policy to `apps/api/prisma/rls.sql`; use
  `TenantScope.run(tenantId, …)` for writes; use `.runAsAdmin(…)` only in the
  admin module.
- Follow `CLAUDE.md` for house rules (no guessing provider fields, kobo
  integers only, invoices immutable after transmission, idempotency on every
  webhook, no PII in logs).

See `GOTCHAS.md` before writing new code — most of the bugs we hit were
non-obvious the first time.
