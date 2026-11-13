# Sequence — WhatsApp invoice creation

```mermaid
sequenceDiagram
    autonumber
    actor Owner as SME Owner
    participant Meta as Meta WhatsApp Cloud API
    participant API as AnnexEvoice API
    participant Redis as Redis (BullMQ)
    participant Worker as Worker
    participant DB as PostgreSQL (RLS)
    participant APP as NRS APP (Mock in dev)
    participant GCS as GCS
    actor Buyer as Buyer

    Owner->>Meta: "invoice Chidi Okafor 50 bags cement @9500"
    Meta->>API: POST /webhooks/whatsapp (signed)
    API->>API: Verify X-Hub-Signature-256
    API->>DB: INSERT whatsapp_messages (idempotent by wa_message_id)
    API->>Redis: enqueue whatsapp-inbound {messageId}
    API-->>Meta: 200 OK

    Worker->>DB: load conversation + tenant + user (by phone)
    Worker->>Worker: run conversation state machine
    Worker->>Worker: rule-based parser (LLM fallback if flag on)
    Worker->>DB: upsert customer "Chidi Okafor"
    Worker->>DB: create INVOICE (status=draft)
    Worker->>Meta: send summary card (Confirm / Edit / Cancel)
    Meta-->>Owner: interactive buttons

    Owner->>Meta: tap Confirm
    Meta->>API: POST /webhooks/whatsapp (button reply)
    API->>Redis: enqueue whatsapp-inbound
    Worker->>DB: assign gapless invoice number (SELECT ... FOR UPDATE)
    Worker->>DB: lock invoice; status=pending_transmission
    Worker->>Redis: enqueue einvoice-submit {invoiceId, idemKey}

    Worker->>APP: submit(invoice) via EInvoiceProvider
    APP-->>Worker: IRN, QR, validated
    Worker->>DB: update invoice (status=transmitted, irn, qr)
    Worker->>GCS: render + upload PDF
    Worker->>Meta: send Owner "INV-000123 sent ✅"
    Worker->>Meta: send Buyer PDF + payment link
    Meta-->>Buyer: PDF + link
```

## Failure branches
- Parser can't resolve: ask a clarifying question; never create the invoice.
- APP submit fails transiently: retry with exponential backoff; invoice stays `pending_transmission`; after DLQ threshold, alert admin and tell the owner transmission is delayed.
- PDF render fails: retry (idempotent); the invoice record is already stored, so the PDF is always re-generable.
- Meta out of 24h window: use an approved template; otherwise fall back to SMS/email.
