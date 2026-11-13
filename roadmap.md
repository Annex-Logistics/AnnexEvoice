# Roadmap

## Now
**Goal:** Foundations: architecture pack, repo scaffold and data layer, runnable locally with one command.

- [x] **Architecture pack**: C4 context and container diagrams, ERD, and sequence diagrams for (a) WhatsApp invoice creation, (b) NRS submission with retry, (c) payment webhook reconciliation, all in Mermaid under `docs/architecture/`.
  - Acceptance: every component in `architecture.md` appears in the diagrams, and every entity listed there appears in the ERD.
- [ ] **ADRs reviewed**: each "Proposed" decision in `decisions.md` is marked Accepted or replaced.
  - Acceptance: no decision needed for Phases 2–3 is still Proposed.
- [x] **Monorepo scaffold**: pnpm + Turborepo, `apps/api`, `apps/worker`, `apps/web`, `apps/admin`, shared packages, lint/format/typecheck configs, `.env.example`, Makefile.
  - Acceptance: `pnpm install && pnpm dev` starts all apps against Docker Compose Postgres + Redis on a clean machine.
- [x] **Data layer**: Prisma schema, migrations, RLS policies, gapless per-tenant invoice numbering, seed data (2 tenants, customers, products, tax rules).
  - Acceptance: an integration test proves tenant A cannot read tenant B's rows even with a raw query that has no tenant filter.
- [x] **CI skeleton**: GitHub Actions running lint, typecheck and tests on PRs.
  - Acceptance: a PR with a type error fails CI.
- [ ] **External dependencies started** (business tasks, run alongside the build):
  - Shortlist and contact accredited APPs and request the technical spec.
  - Start Meta Business verification for the WhatsApp number.
  - Open Paystack test and live accounts.

**Definition of done:** A new developer or agent clones the repo, runs the README commands, sees all four apps start, and the seeded data appears in the API's Swagger at `/docs`.

## Next
**Goal:** MVP. An SME can create an invoice on WhatsApp or the web, it is "transmitted" (MockProvider), the buyer receives a PDF and payment link, and payment is reconciled automatically.

- [x] Core API: auth (WhatsApp/SMS OTP, JWT + refresh), tenants, users/RBAC, customers, products, invoices, credit/debit notes, audit log, OpenAPI + generated client.
- [x] `tax-engine` package: VAT and WHT driven by rules data, 100% branch coverage.
- [x] E-invoicing module: provider interface, MockProvider, submission queue with retries and DLQ, status reconciliation job.
- [x] WhatsApp module: webhook signature verification, conversation state machine, rule-based parser, confirmation buttons, PDF delivery, consent capture.
- [x] PDF rendering in the worker, stored in GCS.
- [x] Payments: Paystack payment links + webhooks + reconciliation. Flutterwave fallback adapter.
- [x] Web PWA: onboarding, invoice list/create/view, customers, products, receivables, VAT/WHT summary.
- [x] Admin console: tenants, submissions monitor + retry, audit log viewer.
- [x] Infrastructure: Terraform, VM bootstrap, Caddy, production Compose, nightly backups to GCS with a tested restore, Ops Agent + Sentry alerts.
- [x] CI/CD: build and push to Artifact Registry, auto-deploy to staging, tagged manual deploy to production, automatic rollback.

**Definition of done:** On the staging VM over HTTPS, a test owner sends a WhatsApp message and confirms it. The invoice appears in the web app with a mock IRN and QR. The buyer's WhatsApp receives the PDF and payment link. A Paystack test payment marks the invoice paid within 60 seconds. A restore from last night's backup has been rehearsed successfully.

## Later
- Real APP adapter (after the spec is received) and pilot with 10 live SMEs
- TIN and CAC verification (Dojah / Prembly) with tiered KYC limits
- Voice-note transcription (Speech-to-Text) and photo/handwritten OCR (Document AI)
- LLM parsing fallback (Claude API) behind a feature flag with per-tenant cost caps
- Paystack subscriptions, plans and dunning
- Accountant portal (multi-client view, bulk export, approvals)
- Mono bank feeds and a payment-matching engine
- Accounting sync: QuickBooks, Xero, Zoho Books, Sage
- POS imports (Moniepoint, Paystack Terminal) and CSV mapping
- Public API with tenant API keys and signed outbound webhooks, plus a developer docs page
- SMS (Termii / Africa's Talking) and email (ZeptoMail / Resend) fallbacks
- PostHog analytics and activation funnels
- Filing reminders and a tax calendar
- Local-language UI (Pidgin, Yoruba, Igbo, Hausa)
- Invoice financing partner interface
- Move Postgres to Cloud SQL, or the API to Cloud Run, when scale demands it (see `decisions.md`)

## Not planned
- Full general-ledger accounting or payroll. We sync with accounting tools rather than replace them.
- Filing VAT/CIT returns on the user's behalf in the MVP. We prepare summaries and remind.
- Native iOS/Android apps. WhatsApp + PWA covers mobile.
- Multi-currency invoicing (NGN only for now)
- Countries other than Nigeria until NRS go-live is stable
- Becoming an accredited APP ourselves (revisit after product-market fit)
- Kubernetes

## Roadmap rules
- Finish Now before starting Next.
- Add acceptance criteria to every major task.
- Move completed work to `changelog.md`.
- Update this file whenever priorities change.
- Any new external integration needs a `decisions.md` entry first.
