# C4 — System Context

AnnexEvoice sits between Nigerian SMEs and the NRS e-invoicing fabric. The SME owner talks to it through WhatsApp or a PWA. The platform transmits invoices to NRS through an accredited Access Point Provider, collects payments through Paystack/Flutterwave, delivers notifications through Meta's Cloud API, SMS and email, and syncs with accounting software the SME already uses.

```mermaid
C4Context
  title System Context — AnnexEvoice

  Person(owner, "SME Owner / Staff", "Issues invoices, chats with the system over WhatsApp or the PWA.")
  Person(buyer, "Buyer / Customer", "Receives the invoice PDF and pays via a link, card, transfer or virtual account.")
  Person(accountant, "External Accountant", "Reviews books, exports reports, switches between many SME tenants.")
  Person(admin, "AnnexEvoice Admin", "Monitors submissions, retries failures, manages tenants & plans.")

  System(annexevoice, "AnnexEvoice", "WhatsApp-first e-invoicing & tax compliance for Nigerian SMEs.")

  System_Ext(nrs, "NRS (via APP)", "Accredited Access Point Provider that validates, signs and transmits e-invoices to NRS / EFS.")
  System_Ext(meta, "Meta WhatsApp Cloud API", "Inbound/outbound WhatsApp messages, templates, media.")
  System_Ext(paystack, "Paystack / Flutterwave", "Payment links, virtual accounts, subscriptions.")
  System_Ext(mono, "Mono", "Read-only bank transaction feeds for payment matching.")
  System_Ext(kyc, "Dojah / Prembly", "TIN & CAC verification.")
  System_Ext(google, "Google Cloud (Speech, Document AI, GCS, Secret Manager, Ops Agent)", "Voice/photo parsing, PDF storage, secrets, logs.")
  System_Ext(sms, "Termii / Africa's Talking", "SMS OTP and reminders.")
  System_Ext(email, "ZeptoMail / Resend", "Transactional email.")
  System_Ext(accounting, "QuickBooks / Xero / Zoho / Sage", "Two-way accounting sync.")
  System_Ext(anthropic, "Anthropic Claude API", "Optional LLM parsing fallback behind a feature flag.")

  Rel(owner, annexevoice, "Issues invoices (text/voice/photo)", "WhatsApp, HTTPS")
  Rel(buyer, annexevoice, "Receives invoice PDF + pays", "WhatsApp, Email, SMS, Browser")
  Rel(accountant, annexevoice, "Manages client books", "HTTPS")
  Rel(admin, annexevoice, "Operates platform", "HTTPS")

  Rel(annexevoice, nrs, "Submit invoices & notes; receive IRN/QR/status", "HTTPS (APP-specific)")
  Rel(annexevoice, meta, "Receive inbound messages; send templates & docs", "HTTPS webhooks + Cloud API")
  Rel(annexevoice, paystack, "Create payment links; receive webhooks", "HTTPS")
  Rel(annexevoice, mono, "Pull bank transactions", "HTTPS")
  Rel(annexevoice, kyc, "Verify TIN / CAC", "HTTPS")
  Rel(annexevoice, google, "Transcribe voice, OCR photos, store PDFs, pull secrets, ship logs", "HTTPS / gRPC")
  Rel(annexevoice, sms, "Send OTP / reminders", "HTTPS")
  Rel(annexevoice, email, "Send invoices / notifications", "HTTPS")
  Rel(annexevoice, accounting, "Two-way sync of customers, products, invoices", "OAuth 2.0 / HTTPS")
  Rel(annexevoice, anthropic, "Parse ambiguous messages (flag-gated)", "HTTPS")
```

## Boundaries

- **Inside AnnexEvoice**: API, worker, databases, static frontends, PDF renderer, mock providers.
- **Outside**: every third-party service above and both user groups.
- **Trust boundary**: every outbound call sits behind a provider adapter; raw provider payloads are never exposed to the client.
