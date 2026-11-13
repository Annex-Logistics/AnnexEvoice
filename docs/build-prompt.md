# Build Prompt — "AnnexEvoice": WhatsApp-First E-Invoicing & Tax Compliance for Nigerian SMEs

## Role

You are a **senior software architect and lead full-stack engineer** with deep experience in fintech/regtech, Nigerian tax compliance, WhatsApp Business Platform integrations, and production deployments on Google Cloud. You will design and build this product **end to end** — architecture, code, tests, infrastructure, CI/CD and deployment to a **GCP Compute Engine VM** — working in small, verifiable increments.

## Product summary

AnnexEvoice lets Nigerian SMEs (turnover below ₦5bn — "medium" and "emerging" taxpayers under the Nigeria Revenue Service (NRS) e-invoicing / Electronic Fiscal System (EFS), also called the Merchant-Buyer Solution (MBS)) issue **NRS-compliant e-invoices from WhatsApp or a lightweight web app**, get paid faster, and stay on top of VAT and WHT obligations.

Core user stories:

1. **WhatsApp invoicing** — A business owner sends `invoice Chidi Okafor 50 bags cement @9500` (or a voice note / photo of a handwritten invoice). The system parses it, replies with a confirmation card (buyer, line items, VAT, total), and on "Confirm" it:
   - creates the invoice, validates it, signs/transmits it to NRS via an **Access Point Provider (APP)** adapter,
   - stores the returned IRN / QR / validation status,
   - sends the buyer a branded PDF + payment link over WhatsApp/email.
2. **Web app (PWA)** — dashboard for invoices, customers, products, receivables ageing, credit/debit notes, VAT & WHT summary, filing calendar, team members.
3. **Payments** — Paystack (primary) / Flutterwave (secondary) payment links; webhooks mark invoices paid and reconcile.
4. **Tax engine** — VAT (7.5%, configurable per item; zero-rated/exempt flags), WHT deductions, filing reminders via WhatsApp before deadlines. All rates and rules must be **config/data-driven**, never hard-coded.
5. **Accountant portal** — multi-client view for accounting firms managing many SMEs (switch tenant, bulk export, approval workflows).
6. **Admin console** — tenant management, APP transmission monitoring, failed-submission retry queue, plans & billing, audit log viewer.
7. **Subscriptions** — tiered plans by invoice volume, billed via Paystack subscriptions.

## Non-negotiable constraints

- **Do not invent NRS/MBS or APP endpoint paths, payload field names, or signing schemes.** Build an `EInvoiceProvider` interface with a `MockProvider` (deterministic fake IRN/QR) and leave a clearly marked `ApprovedApProvider` adapter with TODOs referencing the official NRS/NITDA technical specification. Ask me for the spec before implementing the real adapter.
- Same rule for WhatsApp Cloud API, Paystack and Flutterwave: use their documented APIs only; if unsure of a field, stop and ask.
- **Multi-tenant** from day one (tenant = business, identified by TIN). Every query is tenant-scoped; enforce with PostgreSQL Row-Level Security as defence in depth.
- **Invoices are immutable once transmitted.** Corrections only via credit/debit notes. Keep a full, append-only audit trail (who, what, when, before/after).
- **Idempotency** on all inbound webhooks (WhatsApp, Paystack) and outbound NRS submissions (idempotency keys + dedupe table).
- Money stored as **integer kobo** (`BIGINT`), never floats. Currency NGN, timezone `Africa/Lagos`.
- Compliance with the **Nigeria Data Protection Act (NDPA)**: data minimisation, consent capture for WhatsApp messaging, encryption at rest for PII, data export & deletion endpoints, retention policy config.
- Works on low-end Android and patchy networks: PWA, offline drafts, small bundles.

## Tech stack

**Monorepo:** pnpm workspaces + Turborepo
```
apps/
  api/          NestJS (Node 22 LTS, TypeScript strict)
  worker/       NestJS standalone app — BullMQ consumers
  web/          React 19 + Vite + TypeScript (PWA) — SME & accountant app
  admin/        React 19 + Vite — internal admin console
packages/
  api-client/   generated via openapi-typescript + openapi-fetch
  ui/           shared components (Tailwind CSS + shadcn/ui)
  tax-engine/   pure TS: VAT/WHT calc, rules as data, 100% unit-tested
  config/       eslint, tsconfig, prettier presets
infra/
  docker/ compose/ caddy/ scripts/ terraform/
```

**Backend**
- NestJS with modules: `auth`, `tenants`, `users`, `customers`, `products`, `invoices`, `einvoice` (provider adapters), `tax`, `payments`, `whatsapp`, `notifications`, `billing`, `accountants`, `audit`, `admin`, `health`.
- Swagger/OpenAPI is the **single source of truth**; frontend client generated from it with `openapi-typescript` + `openapi-fetch` (CI fails on contract drift).
- ORM: **Prisma** (migrations committed); raw SQL allowed for RLS policies and reporting views.
- Validation: `class-validator` DTOs at the edge, Zod in `tax-engine`.
- Auth: phone-number OTP (via WhatsApp + SMS fallback, e.g. Termii) + email/password for accountants; JWT access (15 min) + rotating refresh tokens in httpOnly cookies; RBAC roles `owner`, `staff`, `accountant`, `admin`.
- Queues: **BullMQ on Redis** — `whatsapp-inbound`, `einvoice-submit` (exponential backoff, dead-letter queue), `pdf-render`, `notifications`, `reminders` (repeatable jobs).
- WhatsApp message parsing: rule-based grammar first; LLM fallback (behind a feature flag) that must return strict JSON validated by schema, and **always** requires explicit user confirmation before an invoice is created.
- PDF: HTML templates rendered with Playwright/Chromium in the worker; QR code embedded.
- File storage: **Google Cloud Storage** (signed URLs) for PDFs, logos, uploads.
- Logging: pino (JSON) with request IDs and tenant IDs; never log PII or tokens.

**Database**
- **PostgreSQL 17** (self-hosted in Docker on the VM for MVP, with a documented migration path to Cloud SQL).
- **Redis 7** for queues, rate limiting and OTP.
- Core tables: `tenants`, `users`, `memberships`, `customers`, `products`, `invoices`, `invoice_lines`, `credit_notes`, `einvoice_submissions` (status, attempts, provider response, IRN, QR), `payments`, `tax_rules`, `tax_periods`, `whatsapp_conversations`, `whatsapp_messages`, `subscriptions`, `audit_events`, `idempotency_keys`, `consents`.
- Per-tenant gapless invoice numbering via a locked sequence table.
- Produce an ERD (Mermaid) before writing migrations.

**Frontend (web + admin)**
- React 19 + Vite, TanStack Router, TanStack Query, React Hook Form + Zod, Tailwind + shadcn/ui, `vite-plugin-pwa`.
- Mobile-first; target < 200 KB initial JS gzip for `web`.
- i18n-ready (English first; Pidgin/Yoruba/Igbo/Hausa later).
- Accessibility: WCAG 2.1 AA.

## Integrations (all required)

Every integration sits behind its own NestJS module with a **provider interface + mock implementation + real adapter**, its own config block, health check, retry policy, idempotency handling and contract tests. For every one: use only the provider's official documentation, verify webhook signatures, store raw request/response payloads (PII-redacted) for audit, and expose its status in the admin console. If you are unsure of any endpoint or field, stop and ask me.

| # | Integration | Purpose | Provider(s) — primary / fallback | Notes |
|---|---|---|---|---|
| 1 | **NRS e-invoicing (MBS/EFS)** | Validate, sign and transmit invoices, credit/debit notes; receive IRN, QR code, validation status | Accredited **Access Point Provider (APP)**; MockProvider for dev | Pluggable so we can switch APP or become one later. Submission queue, retries, DLQ, reconciliation job that re-queries pending statuses. |
| 2 | **TIN / taxpayer verification** | Validate seller and buyer TINs at onboarding and on invoice creation | NRS / JTB TIN verification via APP or approved KYC aggregator | Cache results with TTL; flag mismatched names. |
| 3 | **Business KYC (CAC)** | Verify RC/BN number, directors, business name at onboarding | Dojah / Prembly (or equivalent KYC aggregator) | Tiered KYC levels unlock invoice volume limits. |
| 4 | **WhatsApp Business Platform (Cloud API)** | Inbound messages, interactive buttons/lists, message templates (invoice sent, payment received, reminders), document delivery | Meta WhatsApp Cloud API directly; BSP (e.g. 360dialog) as fallback adapter | Webhook signature verification, template management + approval tracking, 24-hour session window logic, opt-in/opt-out consent records. |
| 5 | **Voice notes → text** | Let owners dictate invoices | Google Cloud Speech-to-Text (`en-NG`) | Transcript always shown back for confirmation. |
| 6 | **Photo/handwritten invoice → data** | OCR receipts and handwritten invoices sent on WhatsApp | Google Document AI / Cloud Vision | Low-confidence fields require user confirmation. |
| 7 | **LLM parsing fallback** | Parse free-text invoice messages the rule grammar can't | Anthropic Claude API (feature-flagged) | Strict JSON schema output, no PII beyond what's needed, prompt + response logged (redacted), cost cap per tenant. |
| 8 | **Payments collection** | Payment links on invoices, card/bank transfer/USSD, virtual accounts per customer | Paystack (primary), Flutterwave (secondary) | Webhook reconciliation, partial payments, refunds, settlement reports; dedicated virtual accounts for automatic bank-transfer matching. |
| 9 | **Subscription billing** | Charge SMEs for plans | Paystack Subscriptions | Dunning, grace period, plan limits enforced in API. |
| 10 | **Bank feeds** | Pull transactions to auto-match payments made outside payment links | Mono (Connect / statements) | Read-only, explicit consent, matching engine suggests invoice ↔ transaction pairs. |
| 11 | **POS / payment terminals** | Import sales already captured on POS terminals | Moniepoint, Paystack Terminal (where public APIs/webhooks exist) | If no public API, support CSV import with column mapping. |
| 12 | **Accounting software sync** | Two-way sync of customers, products, invoices for SMEs that already use accounting tools | QuickBooks Online, Xero, Zoho Books, Sage | OAuth 2.0, incremental sync with cursors, conflict-resolution rules, sync log per tenant. |
| 13 | **SMS** | OTP fallback, payment reminders for buyers without WhatsApp | Termii (primary), Africa's Talking (fallback) | DND-aware sender IDs. |
| 14 | **Email** | Invoice delivery, receipts, accountant notifications | ZeptoMail or Resend (primary), SendGrid (fallback) | SPF/DKIM/DMARC setup documented. |
| 15 | **File storage** | PDFs, logos, uploaded documents | Google Cloud Storage | Signed URLs, retention rules. |
| 16 | **Secrets** | All API keys and credentials | GCP Secret Manager | Rotation runbook per integration. |
| 17 | **Error monitoring & logs** | App errors, traces, logs, uptime | Sentry + Google Cloud Ops Agent | Integration-specific alerts (e.g. APP failure rate > 2%). |
| 18 | **Product analytics** | Funnels, activation, retention | PostHog (self-hostable) | No PII in events. |
| 19 | **Public API + outbound webhooks** | Let ERPs, POS vendors and partners create invoices and receive events | Our own REST API (API keys per tenant, scoped) | Signed outbound webhooks (`invoice.created`, `invoice.transmitted`, `invoice.paid`, `submission.failed`), retries with backoff, delivery log, developer docs page. |
| 20 | **Lending partners (phase 2)** | Share verified invoice data, with consent, for invoice financing | Partner-specific adapters | Consent-gated data sharing, revocable; design the interface now, implement later. |

Build an **Integrations settings page** in the web app (connect/disconnect, status, last sync, errors) and an **Integration health dashboard** in the admin console.

## Infrastructure & deployment (GCP VM)

Target: single **Compute Engine VM** for MVP, region `europe-west1` or nearest low-latency region to Lagos (justify your choice), e.g. `e2-standard-4`, Ubuntu 24.04 LTS, 100 GB balanced PD.

- **Terraform** (`infra/terraform`): VPC + subnet, firewall rules (80/443 public; 22 only via IAP TCP forwarding — no public SSH), static external IP, VM with a dedicated least-privilege service account, GCS buckets (`invoices-pdf`, `backups`) with lifecycle rules, Artifact Registry (Docker), Secret Manager secrets, Cloud DNS record (optional).
- **Runtime on the VM:** Docker Engine + Docker Compose. Services: `caddy` (reverse proxy, automatic HTTPS), `api`, `worker`, `web` (static, served by Caddy), `admin` (static, behind IP allowlist or Google IAP), `postgres`, `redis`.
- Secrets pulled from **Secret Manager** at deploy time into env files with `600` permissions (env files LF line endings). No secrets in images or git.
- **Backups:** nightly `pg_dump` (plus WAL archiving if feasible) encrypted and pushed to GCS; weekly VM disk snapshot schedule; documented and **tested** restore runbook.
- **Observability:** Google Cloud Ops Agent for logs/metrics; uptime checks on `/health` and `/health/ready`; alerts (email/WhatsApp) for 5xx rate, queue depth, failed NRS submissions, disk > 80%, backup failure. Sentry for app errors.
- **Security hardening:** unattended-upgrades, fail2ban, UFW mirroring GCP firewall, Docker containers non-root, read-only filesystems where possible, Helmet + strict CORS + rate limiting in API, dependency and image scanning.

**CI/CD — GitHub Actions**
1. On PR: install, lint, typecheck, unit tests, integration tests (Testcontainers Postgres + Redis), OpenAPI drift check, build.
2. On merge to `main`: build & push images to Artifact Registry (tagged with git SHA) → deploy to **staging** VM.
3. On tag `v*`: manual approval → deploy to **production** VM.
4. Auth to GCP via **Workload Identity Federation** (no JSON keys).
5. Deploy step: SSH via IAP → `docker compose pull` → run Prisma migrations as a one-off container → `docker compose up -d` → health-check → automatic rollback to previous SHA on failure.

## Testing & quality

- `tax-engine`: 100% branch coverage, table-driven tests with real-world invoice examples.
- API: unit + integration tests per module; contract tests for the provider adapter using the MockProvider.
- WhatsApp flow: conversation-state tests (happy path, ambiguous input, cancel, timeout, duplicate webhook).
- E2E: Playwright for critical web flows (signup, create invoice, credit note, payment reconciliation).
- Load test (k6): 50 invoices/sec sustained submission through the queue on the MVP VM.

## Deliverables, in this order

Stop after each phase, summarise what was built, list files changed, and wait for my go-ahead.

1. **Architecture pack** — C4 context + container diagrams (Mermaid), ERD, sequence diagrams for: WhatsApp invoice creation, NRS submission with retry, payment webhook reconciliation. ADRs for key decisions (monorepo, Prisma, BullMQ, single VM vs Cloud Run, Postgres on VM vs Cloud SQL).
2. **Repo scaffold** — monorepo, tooling, Docker Compose for local dev, `.env.example`, Makefile/justfile, README with one-command local start.
3. **Data layer** — Prisma schema, migrations, RLS policies, seed data (2 tenants, sample customers/products/tax rules).
4. **Core API** — auth, tenants, customers, products, invoices, credit notes, tax engine, audit, OpenAPI + generated client.
5. **E-invoicing module** — provider interface, MockProvider, submission queue with retries/DLQ, status tracking, admin retry UI hooks.
6. **WhatsApp module** — Cloud API webhook (signature verification), conversation state machine, parser, confirmation templates, PDF delivery.
7. **Payments & billing** — Paystack payment links + webhooks, reconciliation, subscriptions, Flutterwave fallback.
7b. **Remaining integrations** — TIN/CAC KYC, voice + OCR, LLM fallback, SMS, email, Mono bank feeds, POS imports, accounting sync (QuickBooks, Xero, Zoho, Sage), public API + outbound webhooks, PostHog. Each with mock + real adapter + contract tests.
8. **Web app (PWA)** then **admin console**.
9. **Infrastructure** — Terraform, VM bootstrap script (cloud-init), Caddy config, Compose prod file, backups, monitoring.
10. **CI/CD** — workflows, staging + production deploy, rollback.
11. **Runbooks** — deploy, rollback, restore from backup, rotate secrets, onboard a new APP provider, incident response.

## Working rules

- Never guess endpoint paths, field names or env variable names that already exist — ask.
- Deliver complete files, not fragments; when changes span many files, package them as a named zip with paths preserved.
- Source files CRLF; `.env*` files LF.
- When removing code, comment it out with a note explaining why rather than deleting silently.
- Explain trade-offs briefly when a decision is mine to make, then recommend one.
- Flag any assumption about Nigerian tax law explicitly so I can verify it with a tax adviser.

Begin with **Phase 1: Architecture pack**.
