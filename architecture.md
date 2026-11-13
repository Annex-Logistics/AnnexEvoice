# Architecture

## System overview
AnnexEvoice is a multi-tenant TypeScript monorepo deployed as Docker containers on a single GCP Compute Engine VM. Users reach it through two channels: WhatsApp (Meta Cloud API webhooks) and a React PWA. Both go through a NestJS REST API, which owns all business logic and writes to PostgreSQL (tenant isolation enforced by Row-Level Security). Slow, failure-prone or external work runs as BullMQ jobs on Redis, processed by a separate worker container. That includes NRS e-invoice transmission, WhatsApp replies, PDF rendering, notifications, bank and accounting sync, and reminders. Every external system sits behind a provider interface with a mock implementation, so the platform runs end to end without real credentials and providers can be swapped without touching business logic. Caddy terminates TLS and serves the static frontends.

```
WhatsApp ─┐                         ┌─> Postgres 17 (RLS)
          ├─> Caddy ─> API (NestJS) ┼─> Redis 7 ─> Worker (BullMQ) ─> NRS APP, Paystack, Meta, GCS, SMS, email, ...
PWA/Admin ┘                         └─> GCS (signed URLs)
```

## Components

### Frontend: Web PWA
- **Responsibilities:**
  - UI for SME owners, staff and accountants: onboarding, invoices, credit/debit notes, customers, products, receivables, VAT/WHT summaries, integrations settings
  - Client-side validation with Zod, server state with TanStack Query, offline drafts
- **Location:** `apps/web/`
- **Communicates with:** API only, via the generated `packages/api-client`. Never calls third-party services directly except Paystack inline checkout using the public key.

### Frontend: Admin console
- **Responsibilities:** Internal operations: tenants, plans, NRS submission monitor and retries, integration health dashboard, audit log viewer.
- **Location:** `apps/admin/`
- **Communicates with:** API admin endpoints (`/admin/*`, `admin` role required). Served behind an IP allowlist or Google IAP.

### API
- **Responsibilities:**
  - Authentication (OTP, JWT, refresh rotation), RBAC, tenant resolution
  - All business rules: invoice lifecycle, immutability after transmission, numbering, tax calculation via `packages/tax-engine`
  - Receiving webhooks (WhatsApp, Paystack, Flutterwave, Mono)
  - Enqueuing jobs, OpenAPI docs, public partner API
- **Location:** `apps/api/`
- **Modules:** `auth`, `tenants`, `users`, `customers`, `products`, `invoices`, `einvoice`, `tax`, `payments`, `whatsapp`, `notifications`, `billing`, `accountants`, `integrations`, `audit`, `admin`, `public-api`, `health`
- **Communicates with:** frontends, PostgreSQL, Redis, GCS. External services only through provider adapters. Long or unreliable calls are always queued.

### Worker
- **Responsibilities:** Running queued jobs:
  - `einvoice-submit`: retries with exponential backoff, then DLQ
  - `einvoice-reconcile`: re-queries pending statuses
  - `whatsapp-inbound` / `whatsapp-outbound`
  - `pdf-render` (Playwright/Chromium)
  - `notifications` (SMS/email)
  - `reminders` (repeatable)
  - `bank-sync`, `accounting-sync`, `webhook-delivery`
- **Location:** `apps/worker/`
- **Communicates with:** PostgreSQL, Redis, GCS and external providers. Shares domain code with the API through the monorepo.

### Database
- **Technology:** PostgreSQL 17 (Docker volume on the VM for the MVP), plus Redis 7 for queues, rate limits and OTP.
- **Stores:**
  - Tenants, people and access: `tenants`, `users`, `memberships`
  - Catalogue: `customers`, `products`
  - Documents: `invoices`, `invoice_lines`, `credit_notes`
  - NRS transmission: `einvoice_submissions` (status, attempts, IRN, QR, provider response)
  - Money: `payments`, `subscriptions`
  - Tax: `tax_rules`, `tax_periods`
  - WhatsApp: `whatsapp_conversations`, `whatsapp_messages`
  - Integrations: `integration_connections`, `sync_logs`, `webhook_endpoints`, `webhook_deliveries`
  - Compliance and safety: `audit_events` (append-only), `idempotency_keys`, `consents`
- **Accessed through:** Prisma, inside a transaction that sets `app.tenant_id` for RLS. Raw SQL only for RLS policies, reporting views and the invoice-number sequence lock.

## Data flow

### A. WhatsApp invoice creation (primary flow)
1. The owner sends `invoice Chidi Okafor 50 bags cement @9500` to the AnnexEvoice WhatsApp number.
2. Meta sends `POST /webhooks/whatsapp`. The API verifies the `X-Hub-Signature-256` signature, stores the message idempotently by message ID, and enqueues `whatsapp-inbound`.
3. The worker resolves the sender's phone number to a user and tenant, then runs the conversation state machine and the rule-based parser. If the parser fails and the flag is on, the LLM fallback runs, and its output must match the JSON schema. The tax engine calculates VAT/WHT.
4. The worker writes a **draft** invoice and replies with a summary card and Confirm / Edit / Cancel buttons.
5. When the owner taps Confirm, the API assigns the next gapless invoice number, locks the invoice, and enqueues `einvoice-submit` with an idempotency key.
6. The worker calls `EInvoiceProvider.submit()`. On success it stores the IRN, QR and status, renders the PDF to GCS, creates a payment link, and sends the buyer the PDF and link by WhatsApp, falling back to email or SMS. On failure it retries with backoff and alerts admins after the DLQ threshold.
7. The owner receives "Invoice INV-000123 sent ✅". The web app shows the invoice in real time.

### B. Payment reconciliation
1. The buyer pays via the payment link or by transfer to a virtual account.
2. Paystack sends `POST /webhooks/paystack`. The API verifies the signature, dedupes by event ID, and records the payment.
3. The API matches the payment to the invoice by reference or virtual account, then updates the paid, part-paid or overpaid status.
4. Notifications go to the owner and buyer, the `invoice.paid` outbound webhook fires, and the accounting sync job is queued.

### C. Web invoice creation
1. The user fills in the invoice form in the PWA.
2. The frontend calls `POST /invoices` (draft), then `POST /invoices/{id}/issue`.
3. The API validates the DTO, tenant membership, role and tax rules.
4. Prisma writes the invoice inside an RLS-scoped transaction, the audit event is recorded, and the job is enqueued.
5. The API returns the invoice with status `pending_transmission`.
6. The frontend shows the status and polls or refetches until `transmitted`, then offers download and share.

## External services
Each service sits behind a provider interface with `mock` and real adapters, a health check, timeouts, retries and stored (PII-redacted) payloads.

| Service | Purpose | Failure behavior |
|---|---|---|
| NRS e-invoicing via APP | Transmit invoices and notes, get IRN/QR | Queue retries with backoff, then DLQ plus admin alert. The invoice stays `pending_transmission`. The user is told transmission is delayed, never shown "failed" for a transient error. |
| Meta WhatsApp Cloud API | Inbound/outbound messages, templates, documents | Outbound retries. Outside the 24-hour window, approved templates only. Falls back to SMS/email for critical notices. |
| Paystack / Flutterwave | Payment links, virtual accounts, subscriptions | If link creation fails, use the other provider. Webhooks are idempotent. A daily reconciliation job catches missed webhooks. |
| Mono | Bank transaction feeds | Sync can be retried. Matches are suggested, never applied automatically without a rule. |
| Dojah / Prembly | TIN and CAC verification | Onboarding is allowed at a lower KYC tier and verification is retried later. |
| Google Speech-to-Text / Document AI | Voice and photo invoice input | On failure, ask the user to type the invoice. |
| Anthropic Claude API | Parsing fallback | Disabled by flag or cost cap. If it fails, ask a clarifying question. |
| Termii / Africa's Talking | SMS OTP and reminders | Fail over between providers. |
| ZeptoMail / Resend | Email delivery | Fail over between providers. Bounces recorded. |
| QuickBooks / Xero / Zoho / Sage | Accounting sync | Incremental cursors. Conflicts flagged for the user. Tokens refreshed automatically, and the user is asked to reconnect if that fails. |
| Google Cloud Storage | PDFs and uploads | Retry. Invoice PDFs are always re-renderable from DB data. |
| Secret Manager | Credentials | Read at deploy time. The deploy fails fast if a secret is missing. |
| Sentry, Cloud Ops, PostHog | Errors, logs, metrics, analytics | Non-blocking. Failures never affect user flows. |

## Boundaries and rules
- **Business logic** lives in API/worker domain services and `packages/tax-engine`. Never in controllers, frontends or provider adapters.
- **Provider adapters** only translate between our domain types and the provider's API. They take no business decisions.
- **Authentication:** every request needs a valid JWT, except webhooks (signature-verified), public payment pages and health checks. Tenant ID comes from the token's membership, never from the request body. RLS is the second line of defence.
- **Invoices are immutable once transmitted.** Corrections only via credit/debit notes. Every state change writes an `audit_events` row.
- **Money** is integer kobo (`BIGINT`). Rates are basis points in `tax_rules`. No floats.
- **Idempotency** is enforced on all inbound webhooks and outbound NRS/payment calls.
- **Never exposed to the client:** secret keys, provider tokens, raw provider responses, other tenants' data, internal error stacks, full TINs/phone numbers in logs.
- **PII** (phone, email, TIN, bank details) is encrypted at field level where stored, redacted in logs, and covered by data export/delete endpoints (NDPA).
- **Performance targets:**
  - API p95 < 300 ms for reads
  - WhatsApp confirmation reply < 5 s
  - Web initial JS < 200 KB gzip
  - 50 invoice submissions/sec through the queue on the MVP VM
- **Security:**
  - No public SSH (IAP only)
  - Containers run non-root
  - Helmet, strict CORS and rate limiting
  - Dependency and image scanning in CI
- **API contract:** OpenAPI is the source of truth. CI fails if the generated client is out of date.
- **Unknown external APIs:** never guess endpoint paths, field names or signing schemes. Ask for the spec.

## Open architecture questions
- Which accredited APP do we integrate first, and what are its auth, signing, payload and callback specs?
- Does the APP push status callbacks, or must we poll? This affects the `einvoice-reconcile` design.
- Which GCP region gives the best latency to Lagos for the cost: `europe-west1`, `africa-south1` (Johannesburg) or another? Benchmark before Terraform.
- Do we need a dedicated WhatsApp BSP for template throughput, or is direct Cloud API enough for the MVP?
- Gapless numbering: one sequence per tenant, or per tenant + branch + document type? Confirm NRS requirements.
- WHT rules and rates under the 2025 tax acts: confirm with a tax adviser before coding the default rule set.
- How long must invoices and audit data be kept under NRS and NDPA rules? This sets the retention policy.
- At what load do we move Postgres to Cloud SQL and the API to Cloud Run or a managed instance group?
