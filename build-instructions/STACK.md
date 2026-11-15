# STACK.md — architecture + contracts at a glance

## Layout
```
apps/
  api/    NestJS REST API, Swagger /docs, OpenAPI /openapi.json
  worker/ NestJS standalone — BullMQ processors
  web/    React 19 + Vite PWA (SME + accountant)
  admin/  React 19 + Vite admin console

packages/
  tax-engine/ pure TS VAT/WHT; CommonJS; 100% unit-tested
  api-client/ openapi-typescript + openapi-fetch (schema still a stub)
  ui/         Button / Card / Input / Badge / StatusPill / Spinner / Tailwind utils
  config/     ESLint + tsconfig base / nest / react

tests/
  e2e/ Playwright (opt-in via pnpm test:e2e)
  load/ k6 script

infra/
  docker/      api.Dockerfile, worker.Dockerfile, web.Dockerfile, admin.Dockerfile
  compose/     docker-compose.dev.yml, docker-compose.prod.yml
  caddy/       Caddyfile
  terraform/   main, variables, network, iam, storage, vm, outputs, tfvars.example
  scripts/     bootstrap-vm.sh, backup-postgres.sh

docs/
  architecture/ c4-context, c4-container, erd, sequence-whatsapp-invoice,
                sequence-nrs-submission, sequence-payment-reconciliation
  runbooks/     deploy, rollback, restore, rotate-secrets,
                onboard-app-provider, incident-response
  build-prompt.md (frozen copy of the senior-architect prompt)

scripts/
  smoke.sh               18-check end-to-end probe
  verify-rls-isolation.sql  Four RLS proofs
```

## Database

### Tenant-scoped tables (RLS ON, FORCE)
tenants (own row), customers, products, invoices, invoice_lines,
credit_notes, einvoice_submissions, payments, tax_rules, tax_periods,
whatsapp_conversations, whatsapp_messages, subscriptions, audit_events,
idempotency_keys, consents, integration_connections, sync_logs,
webhook_endpoints, webhook_deliveries, invoice_sequences.

### Global tables (RLS OFF)
users, memberships, api_keys. (Users & memberships because a user may belong
to multiple tenants. Api_keys because the guard has to look up the tenant
before any tenant context exists.)

### RLS predicate
```
USING (is_admin_scope() OR "tenantId" = current_tenant_id())
```
For tables that reach tenantId via a parent (invoice_lines → invoices,
whatsapp_messages → whatsapp_conversations, sync_logs →
integration_connections, webhook_deliveries → webhook_endpoints), the policy
does an EXISTS against the parent's tenantId.

### Admin bypass
```sql
CREATE OR REPLACE FUNCTION is_admin_scope() RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.is_admin', true) = 'true';
EXCEPTION WHEN others THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;
```
`TenantScope.runAsAdmin(fn)` does both `app.tenant_id = ''` and
`app.is_admin = 'true'` in its transaction, then calls fn.

### Numbering
`invoice_sequences(tenantId, nextNumber)`. `InvoiceNumberService.nextNumber`
(prefix `INV`) and `nextCreditNoteNumber` (prefix `CN`) both bump the same
sequence; both must run inside the transaction that writes the document so
the lock covers the whole operation.

## Auth

- `/v1/auth/otp/request` → stores a HMAC-hashed OTP in Redis (5-min TTL),
  returns the plaintext in dev (`devCode`) so you can test without a real
  sender.
- `/v1/auth/otp/verify` → verifies, issues an access token (`15 min`) and a
  refresh token (`30 days`), sets the refresh as an httpOnly cookie too.
- `/v1/auth/password/login` → email/phone + password + bcrypt.
- `/v1/auth/refresh` → rotates both tokens.
- JWT payload: `{sub, tenantId, role}`. `RolesGuard` reads `@Roles(…)` metadata.

## API key auth

- Guard reads `x-api-key` header, SHA-256s it, looks up `api_keys` by
  `keyHash`, checks `revokedAt`. Sets `req.user = {userId: 'public-api',
  tenantId, role: 'STAFF'}` so `TenantId` / `CurrentUser` decorators still
  work. Bumps `lastUsedAt` asynchronously.
- Mint flow: `POST /v1/api-keys` (JWT auth, any role) returns the plaintext
  exactly once; store it yourself.

## Queues

Redis-backed BullMQ. Queues:
- `einvoice-submit`     — invoice → NRS APP (mock), exp backoff, 6 attempts
- `einvoice-reconcile`  — repeatable; re-query pending submissions
- `whatsapp-inbound`    — parse inbound WA messages, draft invoices
- `whatsapp-outbound`   — send messages (templates, PDFs)
- `pdf-render`          — Playwright/Chromium → GCS
- `notifications`       — SMS + email
- `reminders`           — repeatable; daily 09:00 Africa/Lagos
- `payment-reconcile`   — match payment to invoice, mark PAID/PART_PAID

Every processor runs under `WorkerTenantScope.run(tenantId, …)`.

## Providers (adapter pattern)

| Interface | Token | Mock | Real (status) |
|-----------|-------|------|---------------|
| EInvoiceProvider | `EInvoiceProviderToken` | MockEInvoiceProvider | ApprovedApProvider (stub, pending NRS/APP spec) |
| MessagingProvider | `MessagingProviderToken` | MockWhatsappProvider | MetaWhatsappProvider (works) |
| PaymentProvider | `PaymentProviderToken` | MockPaymentProvider | PaystackProvider (works), FlutterwaveProvider (stub) |
| SmsProvider | `SmsProviderToken` | MockSmsProvider | TermiiProvider (stub) |
| EmailProvider | `EmailProviderToken` | MockEmailProvider | ResendProvider (stub) |

Selected by env: `EINVOICE_PROVIDER=mock|approved-ap`,
`WHATSAPP_PROVIDER=mock|meta`, etc.

## Webhook signatures

### Paystack (`/v1/webhooks/paystack`)
Header `x-paystack-signature`. HMAC **SHA-512** of the raw body using the
Paystack secret key, hex. The adapter uses `timingSafeEqual`.

### Meta WhatsApp (`/v1/webhooks/whatsapp`)
Header `x-hub-signature-256`, value `sha256=<hex>`. HMAC **SHA-256** of the
raw body using `WHATSAPP_APP_SECRET`. GET with `?hub.mode=subscribe&…` is
the verify handshake — returns `hub.challenge`.

Both depend on `NestFactory.create({ rawBody: true })`.

## Money

- All amounts: **integer kobo** (`BIGINT` in Postgres, `bigint` in TS).
- All rates: **basis points** (`750` = 7.5%).
- Rounding: **half-up** via `roundHalfUp(num, denom)` in `tax-engine/money`.
- Never use `number` for amounts. Format for display at the edge (`formatKoboAsNGN`).

## Invoice lifecycle (status machine)

```
DRAFT ──issue()──→ PENDING_TRANSMISSION ──worker──→ TRANSMITTED ──pay──→ PART_PAID ──pay──→ PAID
  │                                                      │
  └─cancel()──→ CANCELLED                                 └─corrections via credit notes (CN)
```

Transitions from TRANSMITTED+ are IMMUTABLE on the invoice row. Only
credit notes alter the effective balance.

## Audit

Every state change writes `audit_events`:
`invoice.drafted`, `invoice.drafted.whatsapp`, `invoice.issued`,
`invoice.transmitted`, `invoice.cancelled`, `credit-note.issued`,
`payment.reconciled`, `customer.created/updated`, `product.created/updated`,
`payment-link.created`.

Append-only. Expose read via `/v1/audit-events`.
