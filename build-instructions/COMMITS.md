# COMMITS.md — every commit on main, with context

In `git log --oneline` order (newest first):

| Hash | Phase | Title | What landed |
|------|-------|-------|-------------|
| `a5e1f76` | O | whole repo is green end to end | `--passWithNoTests` on worker/web/api; e2e split from default test; final build + typecheck + test + smoke all green |
| `ad46ffa` | N | smoke test now covers 18 checks across every layer | Extended `scripts/smoke.sh` for credit notes, public API, admin |
| `7f2571a` | M | admin endpoints see across tenants without BYPASSRLS | `is_admin_scope()` RLS primitive; `runAsAdmin` sets the GUC; verified ADMIN sees 2 tenants, ACCOUNTANT gets 403 |
| `17200bf` | L | credit notes + invoice immutability | `CreditNotesService`, `/v1/credit-notes`, CN-NNNNNN numbering, over-total rejection, draft rejection |
| `48faa2a` | K | public API with per-tenant API keys | `ApiKey` model + migration, `anvx_...` keys, `/v1/api-keys` CRUD, `x-api-key` guard, machine-actor-safe audit (null actorUserId) |
| `1f137f7` | docs | DEVELOPMENT.md | Full local-dev guide capturing all gotchas from Phases A-I |
| `5479c8a` | I | portable RLS applier | `apply-rls.mjs` via Prisma not psql; comment-aware tokenizer; `ALTER ROLE BYPASSRLS` removed from migration |
| `a6f8284` | H | smoke test + RLS proof scripts | `scripts/smoke.sh` (10 checks), `scripts/verify-rls-isolation.sql` |
| `b79222a` | G | WhatsApp webhook → draft invoice | Phone normalization (+? prefix), RLS-scoped ingest, worker drafts invoice from parsed message |
| `6f87dee` | F | payment webhook verifies, records, and reconciles to PAID | `rawBody: true`, scope.run (not runAsAdmin) in webhook, tenantId in reconcile job |
| `59c58f2` | E | worker transmits invoices end-to-end through the mock APP | `WorkerTenantScope`, `EInvoiceSubmitProcessor` stamps MOCK IRN |
| `728bcb7` | D | live end-to-end — API boots, Prisma migrates, RLS enforces | Initial migration + RLS SQL in camelCase, BigInt interceptor, invoice DTO fix, BullMQ job id fix, user demoted from superuser |
| `721c17c` | C | all four apps compile cleanly | Prisma JSON cast, worker `@nestjs/schedule`, vite-env.d.ts, routeTree.tsx, apiGet/apiPost wrapper |
| `23a6a28` | B | tax-engine: strict destructuring + rounding test | Narrow `string | undefined` from `split('.')`; fix half-up boundary; scope coverage to real logic files |
| `0ded90a` | 0 | Initial scaffold | 221 files, 8,680 insertions; the whole tree |
