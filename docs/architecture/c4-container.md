# C4 — Container Diagram

Inside the VM boundary, Caddy terminates TLS and serves the static frontends; the NestJS API owns all business logic; the worker runs BullMQ processors; Postgres and Redis provide durable state and queues. GCS holds PDFs and uploads. Every external service is reached through a provider adapter in the API or worker.

```mermaid
C4Container
  title Container Diagram — AnnexEvoice (single GCP Compute Engine VM for MVP)

  Person(owner, "SME Owner")
  Person(admin, "AnnexEvoice Admin")

  System_Boundary(sb, "AnnexEvoice") {
    Container(caddy, "Caddy", "Reverse proxy + TLS", "Terminates HTTPS, serves the PWA and admin console, proxies /api and /webhooks to the API.")
    Container(web, "Web PWA", "React 19 + Vite", "SME + accountant UI. Served as static assets.")
    Container(adminapp, "Admin Console", "React 19 + Vite", "Internal operations UI. IAP / IP-allowlisted.")
    Container(api, "API", "NestJS (Node 22)", "REST + Swagger. Auth, tenants, invoices, webhooks, admin endpoints.")
    Container(worker, "Worker", "NestJS standalone", "BullMQ processors: einvoice-submit, einvoice-reconcile, whatsapp-inbound, pdf-render, notifications, reminders, bank-sync, accounting-sync, webhook-delivery.")
    ContainerDb(postgres, "PostgreSQL 17", "Docker volume", "Multi-tenant data with Row-Level Security.")
    ContainerDb(redis, "Redis 7", "Docker volume (AOF)", "Queues, rate limits, OTP cache.")
    ContainerDb(gcs, "GCS: invoices-pdf, backups", "Google Cloud Storage", "PDFs, uploads, nightly pg_dump backups.")
  }

  System_Ext(nrs, "NRS via APP")
  System_Ext(meta, "Meta WhatsApp Cloud API")
  System_Ext(paystack, "Paystack / Flutterwave")
  System_Ext(mono, "Mono")
  System_Ext(kyc, "Dojah / Prembly")
  System_Ext(google, "GCP Services")
  System_Ext(sms, "Termii / Africa's Talking")
  System_Ext(email, "ZeptoMail / Resend")
  System_Ext(acct, "QuickBooks / Xero / Zoho / Sage")
  System_Ext(anthropic, "Anthropic Claude API")
  System_Ext(sentry, "Sentry / PostHog")

  Rel(owner, caddy, "Uses PWA / WhatsApp", "HTTPS")
  Rel(admin, caddy, "Uses admin console", "HTTPS (behind IAP)")
  Rel(caddy, web, "Static assets")
  Rel(caddy, adminapp, "Static assets")
  Rel(caddy, api, "Proxies /api, /webhooks, /docs")

  Rel(api, postgres, "SQL", "Prisma, RLS-scoped transactions")
  Rel(api, redis, "Enqueue jobs / rate limits / OTP")
  Rel(api, gcs, "Signed URL issue")
  Rel(worker, postgres, "SQL", "Prisma")
  Rel(worker, redis, "Consume jobs")
  Rel(worker, gcs, "Upload PDFs")

  Rel(meta, api, "Inbound webhooks", "HTTPS (signature-verified)")
  Rel(paystack, api, "Payment webhooks", "HTTPS (signature-verified)")
  Rel(mono, api, "Transaction webhooks", "HTTPS")

  Rel(worker, nrs, "Submit invoices / reconcile", "HTTPS via APP adapter")
  Rel(worker, meta, "Outbound messages / templates", "HTTPS")
  Rel(worker, paystack, "Create links / verify", "HTTPS")
  Rel(worker, mono, "Pull transactions", "HTTPS")
  Rel(worker, kyc, "Verify TIN/CAC", "HTTPS")
  Rel(worker, google, "STT / Doc AI / Secret Manager / Ops", "HTTPS / gRPC")
  Rel(worker, sms, "SMS send", "HTTPS")
  Rel(worker, email, "Email send", "HTTPS")
  Rel(worker, acct, "OAuth sync", "HTTPS")
  Rel(api, anthropic, "LLM parsing (flag-gated)", "HTTPS")
  Rel(api, sentry, "Errors / events", "HTTPS")
```

Every container that talks to an external system does so via its provider adapter (`EInvoiceProvider`, `MessagingProvider`, `PaymentProvider`, `BankFeedProvider`, `KycProvider`, `StorageProvider`, `AccountingProvider`, `SmsProvider`, `EmailProvider`, `LlmParsingProvider`), each with a `mock` and real implementation selected by env.
