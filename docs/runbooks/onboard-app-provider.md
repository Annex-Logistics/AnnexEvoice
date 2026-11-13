# Runbook — Onboard a new APP (Access Point Provider)

## 1. Collect the spec
- Get the APP's **official technical documentation** (PDF or portal). Do not implement from vendor emails or sales decks.
- Confirm: auth method (OAuth client credentials / mTLS / signed JWT), payload field names and types (invoice schema, VAT lines, buyer fields), signing scheme (if any), callback mechanism (push vs poll), rate limits, idempotency support, sandbox environment credentials.
- File it under `docs/integrations/app-<name>-spec-vX.Y.pdf` in a private store (not git).

## 2. Create the adapter
- Copy `apps/api/src/modules/einvoice/providers/approved-ap.provider.ts` and name it `<vendor>.provider.ts`.
- Implement `EInvoiceProvider`: `submit`, `getStatus`, `cancel`, `healthCheck`.
- Map our domain types → the vendor's payload inside the adapter. Business logic stays out.
- Store raw request/response (PII-redacted) in `einvoice_submissions.provider_response`.

## 3. Contract tests
- Create `apps/api/test/providers/<vendor>.contract.spec.ts`.
- Run against the sandbox with real sample invoices for every supported shape (goods, services, exempt, zero-rated, credit note).
- Verify IRN, QR and callback behaviour. Store fixtures.

## 4. Flag on
- Add `EINVOICE_PROVIDER=<vendor>` to the tenant's config (or system default).
- Ship behind a per-tenant feature flag (`features.einvoice.provider`).
- Pilot with one friendly SME for a week; monitor `admin → NRS submissions`.

## 5. Observability + alerting
- Add dashboards: submit latency, failure rate, DLQ depth, last successful IRN per tenant.
- Alert if failure rate > 2% over 15 min, or DLQ > 10.

## 6. Switchover
- Enable for the remaining tenants in batches of 50.
- Keep the previous adapter warm for a week so an emergency fall-back is one env flip away.
