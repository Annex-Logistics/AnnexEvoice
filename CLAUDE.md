# CLAUDE.md — AnnexEvoice

Read this before starting work in the repo. Then read `README.md`, `roadmap.md`, `architecture.md`, `decisions.md`, `changelog.md` and `docs/build-prompt.md`.

## House rules
- **Never guess external API fields or paths.** If a provider's documentation is unclear, stop and ask. This repo is designed around the provider-adapter pattern precisely so you don't have to.
- **Multi-tenancy is non-negotiable.** Every Prisma query runs inside a `withTenant(tenantId)` transaction that sets `app.tenant_id`. RLS is the second line of defence. Any helper that bypasses RLS must be named `*AsAdmin` and only called from the `admin` module.
- **Money is integer kobo (`BIGINT`).** Never use floats, never use `number` for amounts; use `bigint` + the helpers in `packages/tax-engine/src/money.ts`.
- **Invoices are immutable after transmission.** Corrections via credit/debit notes. Every state change writes an `audit_events` row.
- **Idempotency** on every inbound webhook and outbound NRS/payment call.
- **No PII in logs.** The `redact` helper and pino redaction paths cover phone, email, TIN, tokens.

## Working directories
- `apps/api/` NestJS REST API
- `apps/worker/` NestJS BullMQ consumers
- `apps/web/` React PWA
- `apps/admin/` React admin console
- `packages/tax-engine/` pure TS VAT/WHT (no I/O)
- `packages/api-client/` OpenAPI-generated client (regenerate: `pnpm api:generate`)
- `packages/ui/` shared components
- `packages/config/` ESLint/TS/Prettier presets

## Commands
- `pnpm dev` — all apps
- `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm typecheck`
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio`

## Line endings
- Source files: CRLF (`.gitattributes` enforces this)
- `.env*` files: LF

## Comments
Default to no comments. Only add one when the WHY is non-obvious (hidden constraint, subtle invariant, workaround for a specific bug, surprising behaviour). Do NOT narrate what the code does.

## When removing code
Comment it out with a short note explaining why, rather than deleting silently. Delete once the reason is captured elsewhere (ADR, changelog) or at the next release.
