# NEXT.md — prioritized backlog for the next session

Pick the top item, do it in a phase (one commit), run `pnpm build && pnpm test
&& scripts/smoke.sh`, push. Repeat.

Items in rough priority order:

---

## 1. ~~Real OpenAPI client generation~~ — DONE in Phase P
Remaining: response schemas for the admin/audit/billing/payments/credit-notes/
integrations/einvoice/public-api endpoints (add to
`apps/api/src/common/openapi-responses.ts`, then `pnpm api:generate`).

<details><summary>Original brief</summary>

### Real OpenAPI client generation
**Why.** `packages/api-client/src/generated/schema.ts` is still a stub, so
`apps/web` can't use the typed client; it talks to the API via a raw
`apiGet/apiPost` wrapper in `apps/web/src/lib/api.ts`. The CI workflow has
an `openapi-drift` job that would flag this the moment it runs.

**Do.**
1. Boot the API with full config (already works via `pnpm dev`).
2. `pnpm --filter @annexevoice/api-client generate` — it curls
   `${API_BASE_URL}/openapi.json` and overwrites `src/generated/schema.ts`.
3. Rewrite `apps/web/src/lib/api.ts` to use `createAnnexEvoiceClient`,
   keeping `formatNaira`.
4. Update every page to use the typed client. The error handling can
   simplify a lot — the stub forced each page to cast through `unknown`.
5. Commit, push. CI `openapi-drift` will now pass instead of needing the
   skip we snuck in.

</details>

---

## 2. ~~Real PDF rendering~~ — DONE in Phase P3
Remaining: real GCS storage (the `gcs` provider throws
`NotImplementedException`) and real WhatsApp/email delivery of the PDF (the
`notifications` processor still only logs). Both are blocked on real
credentials/eligibility, so the mock storage + mock notifications stay the
default; see NEXT #6.

---

## 3. Testcontainers-based integration tests
**Why.** `scripts/smoke.sh` is great for an ad-hoc check, but CI needs the
same coverage without needing a running API. Convert each check to a vitest
integration test that spins up Postgres + Redis via Testcontainers, runs
`prisma migrate deploy && apply-rls.mjs && seed`, boots the API in-process,
and hits it over HTTP.

**Do.** Start with `apps/api/test/e2e/auth.e2e.spec.ts` — OTP → JWT →
`/tenants/me`. Then one file per layer (invoices, credit notes, admin,
public API, webhooks). Use `test.concurrent` sparingly — RLS tests must not
race on `app.tenant_id`.

---

## 4. Credit-note submission to NRS
**Why.** Phase L creates CNs but leaves them PENDING_TRANSMISSION forever.
There's no `credit-note-submit` queue yet.

**Do.** Mirror `einvoice-submit`:
- New queue `credit-note-submit`.
- Processor under `WorkerTenantScope.run`; calls the same
  `EInvoiceProvider.submit` interface (add `submitCreditNote`?) and stamps
  IRN/QR on the credit note row.
- Enqueue from `CreditNotesService.create` once the row is written.
- Add to smoke: CN → TRANSMITTED within 2s, audit event
  `credit-note.transmitted`.

---

## 5. WhatsApp confirmation flow
**Why.** Right now a WA message creates a DRAFT and stops. The sequence
diagram calls for a Confirm/Edit/Cancel interactive message to the owner,
then on Confirm the invoice is issued.

**Do.**
- `MessagingProvider.sendInteractive(…)` with three buttons — all three
  providers (mock + meta) implement it.
- On interactive button webhook payloads, `WhatsappService.ingestWebhook`
  calls the inbound queue with `{action: 'confirm'|'edit'|'cancel',
  invoiceId}`.
- Worker on `confirm` calls `InvoicesService.issue(tenantId, null,
  invoiceId)`.
- Smoke extension: post a button-reply webhook, expect PENDING_TRANSMISSION
  within 2s.

---

## 6. Email + SMS mocks become real
**Why.** `TermiiProvider` and `ResendProvider` throw `NotImplementedException`.

**Do.** Only against official docs — do not guess field names. Each adds
`send(body) → messageId`, plus webhook signature verification for delivery
receipts. Store raw provider responses (PII-redacted) in `audit_events` or
a `provider_logs` table.

---

## 7. Accounting sync (QBO / Xero / Zoho / Sage)
**Why.** Big surface area; part of Phase 7b in the build prompt but we
didn't touch it. Each is OAuth 2.0 + cursor-based incremental sync.

**Do.** One provider at a time. Start with QBO (the most common).
`AccountingProvider` interface, mock, connect flow stored in
`integration_connections`, sync log table already exists
(`sync_logs`). A nightly repeatable BullMQ job per connected tenant.

---

## 8. PostHog + Sentry wiring
**Why.** DSN envs exist, the client libs are not installed.

**Do.** `@sentry/node` + `@sentry/profiling-node` in the API and worker.
`posthog-js` in the frontends. Redact PII (`req.body.password`,
`*.tin`, `*.phone` already on pino redaction paths — mirror in Sentry).

---

## 9. Frontend: implement the actual UI
**Why.** Right now `apps/web/src/pages/*` mostly render tables fed by
`apiGet`. There's no invoice creation form, no customer create form, no
real receivables ageing, no tax calendar.

**Do.** One page at a time.
- `pages/Invoices/New.tsx` — React Hook Form + Zod; call `apiPost`.
- `pages/Customers/New.tsx`.
- `pages/Tax/Summary.tsx` — a proper chart, not three cards.
- Add service worker offline drafts (invoice drafts queued locally while
  offline, flushed on reconnect).

---

## 10. Admin console UI
**Why.** `apps/admin/src/App.tsx` is a single-page skeleton. The build
prompt wants: tenant list, NRS submission monitor with retry button,
integration health dashboard, audit log viewer.

**Do.** Already have `/v1/admin/*` endpoints for most of this.

---

## 11. Deploy for real
**Why.** `infra/terraform/*.tf` is written but never `terraform apply`'d.
`.github/workflows/deploy-staging.yml` references secrets
(`GCP_WIF_PROVIDER`, etc) that don't exist yet.

**Do.** Follow `docs/runbooks/deploy.md`. Likely blocked on:
- A real GCP project
- Workload Identity Federation setup
- A WhatsApp verified Meta business account
- An accredited NRS APP (the live NRS/APP spec is the last big
  unknown; see `decisions.md` ADR 007).

---

## Open architecture questions
Still unresolved from `architecture.md`:
- Which APP vendor first? Needs the technical spec.
- Does the APP push callbacks or must we poll?
- Best GCP region for Lagos latency: `europe-west1`, `africa-south1`, or
  other? Benchmark before Terraform.
- Gapless numbering: one sequence per tenant, or per tenant × branch ×
  document type? Confirm NRS requirements.
- WHT rules under the 2025 tax acts — confirm with a tax adviser before
  coding the default rule set.
- Retention policy for `audit_events` and `einvoice_submissions` under NRS
  and NDPA.

Document every answer in `decisions.md` before building against it.
