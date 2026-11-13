# Technical Decisions

Agents and developers: do not reverse an **Accepted** decision without adding a new decision that supersedes it. **Proposed** decisions need Toby's sign-off before Phase 2 work depends on them.

---

## Decision 001: TypeScript monorepo with pnpm + Turborepo

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
The API, worker, web app, admin console and tax engine share types, validation and the API client. Contract drift between backend and frontend has been a recurring problem on past projects.

### Options considered
1. **Monorepo (pnpm + Turborepo):** shared types and one CI, but more upfront tooling.
2. **Separate repos per app:** independent deploys, but duplicated types and painful cross-repo changes.
3. **Nx monorepo:** powerful, but heavier and more opinionated than needed.

### Decision
pnpm workspaces + Turborepo.

### Why
Shared packages (`api-client`, `tax-engine`, `ui`) and atomic cross-app changes matter more than independent repos at this stage. Turborepo caching keeps CI fast with little configuration.

### Consequences
Positive:
- One PR can change the API and the frontend together.
- One lint/test/build pipeline.

Negative:
- CI must use affected-only builds as the repo grows.
- All apps share Node and tooling versions.

### Revisit when
Separate teams need independent release cycles.

---

## Decision 002: NestJS (API + worker), React 19 + Vite (frontends)

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
We need a structured backend with dependency injection (for swappable provider adapters), first-class OpenAPI and queue support, plus a fast mobile-first frontend. The team already ships NestJS + React on Annex.

### Options considered
1. **NestJS + React/Vite:** familiar to the team, its modules map cleanly to integrations, and Swagger is built in.
2. **Express/Fastify + React:** lighter, but we'd hand-build structure and DI.
3. **Next.js full-stack:** one framework, but less suited to heavy background workers and webhook-centric backends.

### Decision
NestJS for the API and worker, React 19 + Vite for the web PWA and admin console.

### Why
Team familiarity, DI-friendly provider pattern, generated OpenAPI → `openapi-typescript` + `openapi-fetch` client.

### Consequences
Positive:
- Fast delivery and consistent module structure.
- Typed contracts end to end.

Negative:
- NestJS boilerplate.
- Two frontend apps to maintain.

### Revisit when
The admin and web apps converge enough to merge.

---

## Decision 003: PostgreSQL 17 + Prisma, with Row-Level Security for multi-tenancy

Status: Proposed
Date: 2026-11-13
Owners: Toby

### Context
Every row belongs to a tenant (a business identified by TIN). Leaking invoices between tenants would be a serious compliance and trust failure.

### Options considered
1. **Shared schema + `tenant_id` + Postgres RLS:** one database, enforced at the DB level, but needs per-transaction session settings.
2. **Shared schema + application-level filtering only:** simplest, but one missed `where` leaks data.
3. **Schema- or database-per-tenant:** strongest isolation, but migrations and ops get painful at thousands of SMEs.

### Decision
Shared schema with `tenant_id`, application filtering **and** RLS as defence in depth. Prisma for the ORM and migrations.

### Why
Scales to many small tenants cheaply. RLS catches developer mistakes. Prisma gives typed queries and migrations that agents handle well.

### Consequences
Positive:
- Strong isolation at low ops cost.

Negative:
- Prisma needs a wrapper to set `app.tenant_id` per transaction.
- RLS policies are raw SQL alongside Prisma migrations.
- Admin/reporting queries need a bypass role.

### Revisit when
A large enterprise customer requires a dedicated database.

---

## Decision 004: Single GCP Compute Engine VM with Docker Compose for MVP

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
We need low cost, full control and a simple deploy at MVP scale. Toby is experienced with VM operations.

### Options considered
1. **Single VM + Docker Compose + Caddy:** cheapest and simplest, but a single point of failure and manual scaling.
2. **Cloud Run + Cloud SQL + Memorystore:** managed and autoscaling, but costs more, has cold starts, and makes long-running workers and Chromium PDF rendering awkward.
3. **GKE:** most flexible, but too heavy for an MVP.

### Decision
One Compute Engine VM (Ubuntu 24.04, e.g. `e2-standard-4`) running Docker Compose: Caddy, API, worker, Postgres, Redis. Provisioned with Terraform and deployed from GitHub Actions over IAP.

### Why
Lowest cost and complexity for early traffic. Containerised services keep the move to managed services straightforward.

### Consequences
Positive:
- Predictable monthly cost.
- Simple debugging.
- Same Compose file locally and in production.

Negative:
- Downtime during VM maintenance.
- Vertical scaling only.
- We own backups and patching (mitigated by nightly GCS dumps, snapshots and unattended-upgrades).

### Revisit when
Any of these happen:
- Sustained CPU > 70%
- Paid tenants > 1,000
- An uptime SLA above 99.5% is promised to customers

---

## Decision 005: PostgreSQL self-hosted on the VM (not Cloud SQL) for MVP

Status: Proposed
Date: 2026-11-13
Owners: Toby

### Context
Cloud SQL gives managed backups, high availability and point-in-time recovery, but adds noticeable monthly cost before revenue.

### Options considered
1. **Postgres in Docker on the VM:** cheap, but we own backups and recovery.
2. **Cloud SQL:** managed and reliable, but costs more and adds network configuration.

### Decision
Postgres in Docker on the VM, using a persistent disk, nightly encrypted `pg_dump` to GCS, scheduled disk snapshots, and a restore rehearsed before launch.

### Why
Cost control at MVP, using existing Postgres operations skills.

### Consequences
Positive:
- Low cost.

Negative:
- Recovery point is up to 24 hours unless WAL archiving is added.
- No automatic failover.

### Revisit when
Either of these happen:
- First paying customers go live
- Data loss tolerance drops below 24 hours

At that point, migrate to Cloud SQL.

---

## Decision 006: Redis + BullMQ for background jobs

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
NRS transmission, WhatsApp replies, PDFs, syncs and reminders are slow or unreliable and must be retried safely.

### Options considered
1. **BullMQ on Redis:** mature Node queue with retries, delays, repeatable jobs and a DLQ pattern.
2. **Google Cloud Tasks / Pub/Sub:** managed, but ties us to the cloud and makes local development harder.
3. **Postgres-based queue (pg-boss):** one less service, but lower throughput and fewer features.

### Decision
BullMQ on Redis 7, with a separate worker container.

### Why
Native NestJS integration, the retry and backoff semantics we need, and easy local development.

### Consequences
Positive:
- Resilient external calls.
- Visible queue depth for alerts.

Negative:
- Redis persistence (AOF) must be configured.
- One more stateful service on the VM.

### Revisit when
We move to managed infrastructure.

---

## Decision 007: Provider-adapter pattern with mocks for every external integration

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
The NRS/APP technical spec isn't available yet. Providers such as Paystack/Flutterwave and Termii/Africa's Talking may need to be swapped. We must not guess external API fields.

### Options considered
1. **Interface + mock + real adapters, selected by env config:** more code upfront, but the system is testable and runnable today.
2. **Call providers directly from services:** faster to write, but blocked by missing specs and hard to swap.

### Decision
Every integration implements a domain interface (e.g. `EInvoiceProvider`, `PaymentProvider`, `MessagingProvider`). A `MockProvider` is the default in dev and CI, and real adapters are added only from official documentation.

### Why
We can build and demo the full flow before the APP spec arrives, providers can be swapped without touching business logic, and contract tests stay deterministic.

### Consequences
Positive:
- Not blocked by external partners.
- Easy failover between providers.

Negative:
- Mocks can drift from reality. Contract tests are needed when real specs arrive.

### Revisit when
Never for the pattern. Revisit individual providers as needed.

---

## Decision 008: Money stored as integer kobo; tax rules stored as data

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
Floating-point money causes rounding errors. Nigerian tax rates and rules change, as the 2025 tax reforms showed.

### Options considered
1. **Integer kobo (`BIGINT`) + rates in basis points stored in `tax_rules`:** exact and configurable.
2. **`NUMERIC` decimals + hard-coded rates:** exact, but rate changes need deploys.

### Decision
All amounts in integer kobo. Rates in basis points. VAT/WHT rules are versioned rows with effective dates, evaluated by the pure `packages/tax-engine`.

### Why
Exact arithmetic, and a rate change becomes a data change instead of a deploy.

### Consequences
Positive:
- No rounding drift.
- Historical invoices keep the rules that were in force when they were issued.

Negative:
- Formatting is needed at every display edge.
- Rounding policy must be explicit and documented.

### Revisit when
Multi-currency support is added.

---

## Decision 009: WhatsApp via Meta Cloud API directly (BSP as fallback adapter)

Status: Proposed
Date: 2026-11-13
Owners: Toby

### Context
WhatsApp is the primary channel. We can connect directly to Meta's Cloud API or go through a Business Solution Provider (BSP).

### Options considered
1. **Meta Cloud API direct:** no middleman fees and the latest features, but we handle templates and verification ourselves.
2. **BSP (e.g. 360dialog):** onboarding help and support, but extra cost and dependency.

### Decision
Direct Cloud API, with the `MessagingProvider` interface allowing a BSP adapter later.

### Why
Lower cost, and the adapter pattern keeps a BSP switch cheap.

### Consequences
Positive:
- Lower cost per conversation.
- Direct feature access.

Negative:
- We own business verification, template approvals and quality-rating monitoring.

### Revisit when
Template approval or throughput limits block growth.

---

## Decision 010: Invoices immutable after transmission; corrections via credit/debit notes

Status: Accepted
Date: 2026-11-13
Owners: Toby

### Context
Transmitted e-invoices carry an NRS-issued IRN. Editing them would break compliance and the audit trail.

### Options considered
1. **Immutable after transmission + credit/debit notes:** compliant and auditable.
2. **Editable with re-submission:** easier for users, but likely non-compliant and confusing.

### Decision
Drafts are editable. Once issued and transmitted, invoices are locked, and corrections are made through credit or debit notes, each transmitted in its own right. All changes write to the append-only `audit_events`.

### Why
Matches e-invoicing norms and protects users in audits.

### Consequences
Positive:
- Clean audit trail.
- Lower compliance risk.

Negative:
- More UX work to make credit notes easy from WhatsApp.

### Revisit when
The NRS spec defines a different correction mechanism.

---

Copy the decision section for every important choice involving architecture, database, authentication, hosting, APIs, libraries, or security.
