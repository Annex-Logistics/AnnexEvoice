# Sequence — Payment webhook reconciliation

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant Paystack as Paystack
    participant API as AnnexEvoice API
    participant DB as PostgreSQL
    participant Redis as Redis (BullMQ)
    participant Worker as Worker
    participant Meta as Meta WhatsApp Cloud API
    participant Accounting as Accounting Provider (QBO/Xero/Zoho/Sage)
    participant Outbound as Partner Webhook Endpoint

    Buyer->>Paystack: pay invoice via link / virtual account
    Paystack->>API: POST /webhooks/paystack (signed)
    API->>API: Verify x-paystack-signature (HMAC SHA-512)
    API->>DB: dedupe by event id (idempotency_keys)
    API->>DB: INSERT payment (status=pending)
    API->>Redis: enqueue payment-reconcile {paymentId}
    API-->>Paystack: 200 OK

    Worker->>DB: load payment + invoice (by reference / virtual account)
    alt amount matches invoice.total
      Worker->>DB: payment.status=succeeded; invoice.status=paid
    else partial
      Worker->>DB: invoice.status=part_paid; running total updated
    else overpayment
      Worker->>DB: invoice.status=paid; log credit for later refund
    else no invoice found
      Worker->>DB: payment.status=unmatched; raise admin review
    end

    Worker->>Meta: notify Owner ("INV-000123 marked paid ✅")
    Worker->>Meta: notify Buyer receipt
    Worker->>Outbound: POST invoice.paid (HMAC-signed, retry w/ backoff)
    Worker->>Accounting: queue accounting-sync job

    note over API,Paystack: Daily reconciliation job queries Paystack transactions since last cursor to catch missed webhooks.
```

## Dedup rules
- `idempotency_keys(scope='paystack:webhook', key=event.id)` blocks duplicate deliveries.
- `payments.reference` is unique per tenant; a replay with the same reference updates no rows.
- Unmatched payments are surfaced in the admin console with "match to invoice" and "refund" actions.
