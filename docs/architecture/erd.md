# ERD — AnnexEvoice

Every tenant-scoped row carries `tenant_id` and is protected by Row-Level Security. Money is stored as integer kobo. Rates are in basis points on `tax_rules`.

```mermaid
erDiagram
  TENANT ||--o{ MEMBERSHIP : "has"
  USER ||--o{ MEMBERSHIP : "belongs to"
  TENANT ||--o{ CUSTOMER : "has"
  TENANT ||--o{ PRODUCT : "has"
  TENANT ||--o{ INVOICE : "issues"
  CUSTOMER ||--o{ INVOICE : "billed to"
  INVOICE ||--o{ INVOICE_LINE : "contains"
  PRODUCT ||--o{ INVOICE_LINE : "priced by"
  INVOICE ||--o{ CREDIT_NOTE : "corrected by"
  INVOICE ||--|| EINVOICE_SUBMISSION : "transmitted as"
  INVOICE ||--o{ PAYMENT : "paid by"
  TENANT ||--o{ TAX_RULE : "configures"
  TAX_RULE ||--o{ TAX_PERIOD : "versions"
  TENANT ||--o{ WHATSAPP_CONVERSATION : "owns"
  WHATSAPP_CONVERSATION ||--o{ WHATSAPP_MESSAGE : "has"
  TENANT ||--o{ SUBSCRIPTION : "pays"
  TENANT ||--o{ AUDIT_EVENT : "logs"
  TENANT ||--o{ IDEMPOTENCY_KEY : "dedupes"
  TENANT ||--o{ CONSENT : "records"
  TENANT ||--o{ INTEGRATION_CONNECTION : "connects"
  INTEGRATION_CONNECTION ||--o{ SYNC_LOG : "produces"
  TENANT ||--o{ WEBHOOK_ENDPOINT : "subscribes"
  WEBHOOK_ENDPOINT ||--o{ WEBHOOK_DELIVERY : "receives"
  TENANT ||--|| INVOICE_SEQUENCE : "numbers"

  TENANT {
    uuid id PK
    string legal_name
    string trading_name
    string tin
    string rc_number
    string address
    string phone
    string email
    enum kyc_tier
    datetime created_at
  }
  USER {
    uuid id PK
    string phone
    string email
    string hashed_password
    datetime created_at
  }
  MEMBERSHIP {
    uuid id PK
    uuid tenant_id FK
    uuid user_id FK
    enum role
    datetime created_at
  }
  CUSTOMER {
    uuid id PK
    uuid tenant_id FK
    string name
    string phone
    string email
    string tin
    string address
    boolean is_vat_registered
    datetime created_at
  }
  PRODUCT {
    uuid id PK
    uuid tenant_id FK
    string name
    string sku
    bigint unit_price_kobo
    uuid tax_rule_id FK
    boolean active
    datetime created_at
  }
  INVOICE {
    uuid id PK
    uuid tenant_id FK
    uuid customer_id FK
    string number
    enum status
    bigint subtotal_kobo
    bigint vat_kobo
    bigint wht_kobo
    bigint total_kobo
    string irn
    string qr_payload
    datetime issued_at
    datetime transmitted_at
    datetime due_at
    datetime created_at
  }
  INVOICE_LINE {
    uuid id PK
    uuid invoice_id FK
    uuid product_id FK
    string description
    bigint unit_price_kobo
    int quantity
    bigint line_total_kobo
    uuid tax_rule_id FK
  }
  CREDIT_NOTE {
    uuid id PK
    uuid tenant_id FK
    uuid invoice_id FK
    string number
    string reason
    bigint total_kobo
    string irn
    string qr_payload
    enum status
    datetime issued_at
  }
  EINVOICE_SUBMISSION {
    uuid id PK
    uuid tenant_id FK
    uuid invoice_id FK
    enum status
    int attempts
    string provider
    string irn
    string qr_payload
    json provider_response
    datetime last_attempt_at
    datetime created_at
  }
  PAYMENT {
    uuid id PK
    uuid tenant_id FK
    uuid invoice_id FK
    string provider
    string reference
    bigint amount_kobo
    enum status
    datetime received_at
    json provider_payload
  }
  TAX_RULE {
    uuid id PK
    uuid tenant_id FK
    enum kind
    string name
    int rate_bps
    datetime effective_from
    datetime effective_to
  }
  TAX_PERIOD {
    uuid id PK
    uuid tenant_id FK
    date period_start
    date period_end
    enum kind
    bigint total_vat_kobo
    bigint total_wht_kobo
  }
  WHATSAPP_CONVERSATION {
    uuid id PK
    uuid tenant_id FK
    string waba_id
    string phone
    enum state
    json context
    datetime last_message_at
  }
  WHATSAPP_MESSAGE {
    uuid id PK
    uuid conversation_id FK
    string wa_message_id
    enum direction
    enum kind
    string body
    json payload
    datetime created_at
  }
  SUBSCRIPTION {
    uuid id PK
    uuid tenant_id FK
    string plan_code
    enum status
    datetime current_period_end
  }
  AUDIT_EVENT {
    uuid id PK
    uuid tenant_id FK
    uuid actor_user_id
    string action
    string entity
    uuid entity_id
    json before
    json after
    datetime created_at
  }
  IDEMPOTENCY_KEY {
    uuid id PK
    uuid tenant_id FK
    string scope
    string key
    string response_hash
    datetime created_at
  }
  CONSENT {
    uuid id PK
    uuid tenant_id FK
    uuid user_id
    string purpose
    boolean granted
    datetime granted_at
    datetime revoked_at
  }
  INTEGRATION_CONNECTION {
    uuid id PK
    uuid tenant_id FK
    string provider
    enum status
    json config
    datetime connected_at
    datetime last_sync_at
  }
  SYNC_LOG {
    uuid id PK
    uuid connection_id FK
    enum result
    string summary
    datetime created_at
  }
  WEBHOOK_ENDPOINT {
    uuid id PK
    uuid tenant_id FK
    string url
    string secret
    boolean active
  }
  WEBHOOK_DELIVERY {
    uuid id PK
    uuid endpoint_id FK
    string event_type
    int status_code
    int attempts
    json payload
    datetime delivered_at
  }
  INVOICE_SEQUENCE {
    uuid tenant_id PK,FK
    bigint next_number
  }
```

## Numbering
`invoice_sequences` holds `(tenant_id, next_number)` and is updated inside the same transaction that issues an invoice, with `SELECT ... FOR UPDATE` so numbers are gapless.

## Retention
`audit_events`, `einvoice_submissions` and `webhook_deliveries` are append-only and retained per the NRS/NDPA policy.
