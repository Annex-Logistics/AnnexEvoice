# AnnexEvoice

WhatsApp-first e-invoicing and tax compliance for Nigerian SMEs (medium and emerging taxpayers, turnover below ₦5bn). A business owner can send a WhatsApp message, voice note or photo such as `invoice Chidi Okafor 50 bags cement @9500`. AnnexEvoice turns it into an invoice compliant with the Nigeria Revenue Service (NRS) e-invoicing rules (EFS / Merchant-Buyer Solution) and transmits it through an accredited Access Point Provider (APP). It then sends the buyer a PDF and a payment link. AnnexEvoice also tracks VAT and WHT obligations, sends filing reminders, reconciles payments, and gives accounting firms one portal for all their SME clients.

## Tech stack

- **Frontend:** React 19 + Vite + TypeScript, TanStack Router/Query, React Hook Form + Zod, Tailwind CSS + shadcn/ui, PWA (`vite-plugin-pwa`)
- **Backend:** Node 22 LTS, NestJS (TypeScript strict), BullMQ workers, Prisma ORM, OpenAPI → `openapi-typescript` + `openapi-fetch`
- **Database:** PostgreSQL 17 (Row-Level Security for tenant isolation), Redis 7 (queues, rate limiting, OTP)
- **Hosting:** Google Cloud: Compute Engine VM (Ubuntu 24.04) running Docker Compose behind Caddy; Artifact Registry, Secret Manager, Cloud Storage, Cloud Ops; Terraform; GitHub Actions with Workload Identity Federation
- **Key services:**
  - NRS e-invoicing via an APP (mocked until the spec is received)
  - Meta WhatsApp Cloud API
  - Payments: Paystack (primary), Flutterwave (fallback)
  - Mono bank feeds
  - KYC: Dojah / Prembly
  - SMS: Termii, Africa's Talking
  - Email: ZeptoMail / Resend
  - Google Speech-to-Text and Document AI
  - Anthropic Claude API (parsing fallback)
  - Accounting sync: QuickBooks / Xero / Zoho Books / Sage
  - Sentry, PostHog

## Run locally

1. Copy the environment file: `cp .env.example .env`
2. Install dependencies: `pnpm install`
3. Start infrastructure (Postgres, Redis, Mailpit): `docker compose -f infra/compose/docker-compose.dev.yml up -d`
4. Apply migrations and seed: `pnpm db:migrate && pnpm db:seed`
5. Start all apps in dev mode: `pnpm dev`
6. Open:
   - Web app: http://localhost:5173
   - Admin console: http://localhost:5174
   - API + Swagger: http://localhost:3000/docs
   - Mailpit: http://localhost:8025

All external integrations default to **mock providers** in development (`*_PROVIDER=mock`), so no real credentials are needed to run locally.

## Required environment variables

See `.env.example` for the full list. The important groups are:

| Variable | What it controls |
|---|---|
| `NODE_ENV` | Runtime mode (`development` / `staging` / `production`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing keys for access and refresh tokens |
| `PII_ENCRYPTION_KEY` | Key for field-level encryption of PII at rest |
| `APP_BASE_URL` / `API_BASE_URL` | Public URLs used in links, PDFs and webhooks |
| `EINVOICE_PROVIDER` | `mock` or the selected APP adapter |
| `EINVOICE_APP_*` | Credentials for the Access Point Provider (defined once the spec is received) |
| `WHATSAPP_PROVIDER` | `mock` or `meta` |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN` | WhatsApp Cloud API credentials and webhook verification |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Paystack payments and subscriptions |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave fallback payments |
| `MONO_SECRET_KEY` | Mono bank feeds |
| `KYC_PROVIDER` / `KYC_API_KEY` | TIN and CAC verification |
| `SMS_PROVIDER` / `TERMII_API_KEY` | SMS OTP and reminders |
| `EMAIL_PROVIDER` / `EMAIL_API_KEY` / `EMAIL_FROM` | Transactional email |
| `GCP_PROJECT_ID` / `GCS_BUCKET_INVOICES` | Google Cloud project and PDF storage bucket |
| `LLM_PARSER_ENABLED` / `ANTHROPIC_API_KEY` | AI fallback parser feature flag and key |
| `QBO_*` / `XERO_*` / `ZOHO_*` / `SAGE_*` | OAuth client credentials for accounting sync |
| `SENTRY_DSN` | Error monitoring |
| `POSTHOG_KEY` / `POSTHOG_HOST` | Product analytics |

Never commit real values. In staging and production, secrets come from GCP Secret Manager. Env files use LF line endings.

## Main features

- WhatsApp invoicing by text, voice note or photo, with a confirmation step before anything is issued
- NRS-compliant e-invoices, credit notes and debit notes, with IRN and QR code, transmitted through an APP with automatic retries
- Payment links, virtual accounts and automatic payment reconciliation (Paystack / Flutterwave / Mono)
- VAT and WHT engine driven by configurable rules, with filing calendar and WhatsApp reminders
- PWA dashboard: invoices, customers, products, receivables ageing, tax summaries
- Accountant portal for managing many client businesses
- Two-way sync with QuickBooks, Xero, Zoho Books and Sage, plus POS/CSV imports
- Public REST API and signed outbound webhooks for partners
- Admin console: tenants, submission monitoring and retries, integration health, audit log, billing

## Project structure

- `apps/api/`: NestJS REST API (business logic, auth, integrations, OpenAPI)
- `apps/worker/`: NestJS BullMQ consumers (NRS submission, WhatsApp inbound, PDFs, notifications, reminders, sync)
- `apps/web/`: React PWA for SME owners, staff and accountants
- `apps/admin/`: React internal admin console
- `packages/api-client/`: typed API client generated from OpenAPI
- `packages/ui/`: shared UI components
- `packages/tax-engine/`: pure TypeScript VAT/WHT calculation, rules as data
- `packages/config/`: shared ESLint, TS and Prettier config
- `infra/`: Docker, Compose, Caddy, Terraform, VM bootstrap and backup scripts
- `docs/`: diagrams, runbooks, API docs
- `tests/`: end-to-end (Playwright) and load (k6) tests

## Useful commands

- `pnpm dev`: run all apps in watch mode
- `pnpm build`: build all apps and packages
- `pnpm lint` / `pnpm typecheck`: static checks
- `pnpm test`: unit and integration tests
- `pnpm test:e2e`: Playwright end-to-end tests
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio`: database tasks
- `pnpm api:generate`: regenerate the typed client from OpenAPI
- `make deploy-staging` / `make deploy-prod`: manual deploy helpers (CI normally runs these)

## Current status

**Scaffold complete + MVP flow verified end-to-end on a local stack.** All 15 phases A–O are committed on `main`. The full invoice lifecycle (WhatsApp message → draft → issue → MOCK IRN transmission → Paystack webhook → reconcile → PAID), credit notes, per-tenant API keys, admin cross-tenant view, and PostgreSQL Row-Level Security are all working. `pnpm build` 5/5, `pnpm typecheck` 9/9, `pnpm test` 6/6 (16 tests pass), `scripts/smoke.sh` 18/18.

- **What works today:** everything in the sequence diagrams, with mocks for every external provider.
- **What's incomplete:** real APP adapter (blocked on NRS/APP spec), WhatsApp template approvals (blocked on Meta business verification), production deploy (needs Terraform `apply` and DNS).
- **Next milestone:** confirm Proposed ADRs, obtain NRS/APP spec, wire real OpenAPI client generation, run first staging deploy.

### Picking this up in a new session

Everything a new Claude Code session needs to clone this repo and continue is in **`build-instructions/`**:

- `build-instructions/SESSION.md` — primary handoff: what was built, test results, where to pick up
- `build-instructions/RESUME.md` — exact shell commands to get the stack back up
- `build-instructions/PHASES.md` — per-phase log with commit hashes
- `build-instructions/GOTCHAS.md` — 22 traps we hit, with fixes
- `build-instructions/STACK.md` — architecture + contracts at a glance
- `build-instructions/NEXT.md` — prioritized backlog
- `build-instructions/COMMITS.md` — every commit on main with context

## Project documents

Read all five before any major build: `README.md`, `roadmap.md`, `architecture.md`, `decisions.md`, `changelog.md`.
