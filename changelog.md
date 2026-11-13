# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Added
- Project documents: `README.md`, `roadmap.md`, `architecture.md`, `decisions.md`, `changelog.md`. These give coding agents and developers a shared view of scope, priorities, structure and past decisions before any code is written.
- Build prompt for the senior-architect agent (`docs/build-prompt.md`), covering stack, integrations, GCP VM deployment, CI/CD and phased deliverables.
- Architecture pack under `docs/architecture/`: C4 context and container diagrams, ERD, and sequence diagrams for the WhatsApp invoice flow, NRS submission with retry, and payment reconciliation (Mermaid).
- Monorepo scaffold: pnpm workspaces + Turborepo with `apps/api`, `apps/worker`, `apps/web`, `apps/admin`, and shared packages `api-client`, `ui`, `tax-engine`, `config`.
- Data layer: Prisma schema covering tenants, memberships, customers, products, invoices, credit/debit notes, NRS submissions, payments, tax rules, WhatsApp conversations, integrations, audit, idempotency and consents. RLS policies and per-tenant gapless numbering. Seed data with two tenants, customers, products and VAT/WHT rules.
- `tax-engine` package: pure TypeScript VAT and WHT calculation driven by rules data, with table-driven tests.
- Core API modules scaffolded: `auth`, `tenants`, `users`, `customers`, `products`, `invoices`, `einvoice`, `tax`, `payments`, `whatsapp`, `notifications`, `billing`, `accountants`, `integrations`, `audit`, `admin`, `public-api`, `health`. Swagger/OpenAPI on `/docs`.
- `EInvoiceProvider` interface with a deterministic `MockProvider` and a marked `ApprovedApProvider` stub awaiting the official APP specification.
- Mocks for every external provider (payments, messaging, SMS, email, KYC, storage, accounting sync) so the system runs end to end without real credentials.
- WhatsApp inbound webhook with signature verification, conversation state machine skeleton, rule-based parser, confirmation buttons, PDF delivery handoff.
- Paystack payment-link module with webhook verification and mock reconciliation; Flutterwave stub.
- Web PWA and admin console scaffolds with TanStack Router/Query, Tailwind, shadcn-style components, and PWA manifest.
- Infrastructure: `docker-compose.dev.yml`, `docker-compose.prod.yml`, Caddy config, VM bootstrap script, Terraform for VPC, firewall, VM, Secret Manager and GCS, nightly `pg_dump` backup script.
- CI/CD: GitHub Actions for lint/typecheck/test on PRs, staging deploy on `main`, tagged production deploy with manual approval, Workload Identity Federation auth.
- Runbooks under `docs/runbooks/`: deploy, rollback, restore from backup, rotate secrets, onboard a new APP provider, incident response.

### Changed
- Product name changed from "Invoiq" to "AnnexEvoice" across all documents and code.

### Fixed
- Nothing yet.

### Removed
- Nothing yet.

## Update rules
- Add an entry whenever user-visible behavior changes.
- Describe what changed and why it matters.
- Link to the relevant issue or pull request when available.
- Move Unreleased entries into a version section at release time (`## [0.1.0] - YYYY-MM-DD`).
- Use Git history for version recovery; use this file for a readable summary.
- Note any change to tax rules, NRS submission behavior or integrations under its own bullet, so compliance changes are easy to audit.
