# Sequence — NRS submission with retry & reconcile

```mermaid
sequenceDiagram
    autonumber
    participant API as AnnexEvoice API
    participant Redis as Redis (BullMQ)
    participant Worker as Worker (einvoice-submit)
    participant DLQ as DLQ
    participant Reconciler as Worker (einvoice-reconcile, repeatable)
    participant APP as NRS APP (Mock in dev)
    participant DB as PostgreSQL
    participant Admin as Admin Console

    API->>Redis: enqueue einvoice-submit {invoiceId, idempotencyKey}
    Redis->>Worker: deliver job

    loop retries (exp backoff: 5s, 15s, 60s, 5m, 30m, 2h)
      Worker->>APP: POST submit(payload) with idempotencyKey
      alt success
        APP-->>Worker: IRN + QR + status=validated
        Worker->>DB: update einvoice_submissions status=succeeded
        Worker->>DB: update invoices status=transmitted, irn, qr
        Note over Worker,DB: Audit event written
      else transient failure (5xx, timeout)
        APP-->>Worker: error
        Worker->>DB: increment attempts, record provider_response
      else permanent failure (4xx validation)
        APP-->>Worker: error with reason
        Worker->>DB: einvoice_submissions status=permanent_failed, reason
        Worker->>Admin: alert + show on retry queue
        Note over Worker,DB: Invoice stays pending_transmission; owner told "action needed"
      end
    end

    alt retries exhausted
      Worker->>DLQ: move job
      Worker->>Admin: alert (slack/email/WhatsApp)
    end

    Reconciler-->>Reconciler: every 10 min
    Reconciler->>DB: SELECT submissions WHERE status=pending AND age > 5m
    Reconciler->>APP: query status by submissionId/irn
    APP-->>Reconciler: status
    Reconciler->>DB: update submission + invoice
```

## Idempotency
Every `einvoice-submit` job carries an `idempotencyKey` (derived from invoice id + locked number). The APP adapter sends the same key on every retry so the APP de-duplicates. We also store the key in `idempotency_keys` and refuse a duplicate.
