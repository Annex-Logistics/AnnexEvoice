# Development

How to get AnnexEvoice running locally, and the gotchas that will trip you up on day one.

## Prereqs
- Node 22 (`.nvmrc` pins it; `nvm use`)
- pnpm 9.12.0 (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Postgres 16 or 17 — Docker or native
- Redis 7 — Docker or native

## Fast start (Docker)
```bash
cp .env.example .env
pnpm install
docker compose -f infra/compose/docker-compose.dev.yml up -d
pnpm --filter @annexevoice/api exec prisma migrate dev
pnpm --filter @annexevoice/api db:seed
pnpm dev
```
Open http://localhost:5173 (web), http://localhost:5174 (admin), http://localhost:3000/docs (Swagger).

## Fast start (native Postgres/Redis, no Docker)
```bash
# Postgres on 5433
PGDATA=/var/lib/postgresql/16/annexevoice
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D "$PGDATA" --auth-local=trust --auth-host=trust
echo "unix_socket_directories='$PGDATA'" | sudo -u postgres tee -a "$PGDATA/postgresql.conf"
echo "port=5433"                          | sudo -u postgres tee -a "$PGDATA/postgresql.conf"
sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" -l "$PGDATA/log" start

# Role + database (NOT superuser — see "Why not superuser" below)
sudo -u postgres psql -h "$PGDATA" -p 5433 -c "CREATE USER annexevoice PASSWORD 'annexevoice';"
sudo -u postgres psql -h "$PGDATA" -p 5433 -c "CREATE DATABASE annexevoice OWNER annexevoice;"

# One-time admin bypass role for the few admin paths that run outside a tenant scope
sudo -u postgres psql -h "$PGDATA" -p 5433 -d annexevoice -c "CREATE ROLE app_admin; ALTER ROLE app_admin BYPASSRLS;"

# Redis on 6380
redis-server --daemonize yes --port 6380
```
Set `DATABASE_URL=postgresql://annexevoice:annexevoice@localhost:5433/annexevoice?schema=public` and `REDIS_URL=redis://localhost:6380` in `.env`, then `pnpm install && pnpm --filter @annexevoice/api exec prisma migrate dev && pnpm --filter @annexevoice/api db:seed && pnpm dev`.

## PII_ENCRYPTION_KEY
Must decode to 32 bytes base64. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Why not superuser
RLS policies are enforced on every query, but **superusers bypass RLS silently** — the app would return data from every tenant. Keep the `annexevoice` role as a plain DB owner. If you created it with `SUPERUSER` by mistake, demote it:
```sql
ALTER USER annexevoice NOSUPERUSER;
```

## Run the smoke test
```bash
pnpm dev &                # API on :3000
bash scripts/smoke.sh     # 10 checks, <2s
```

## Run the RLS proof
```bash
psql "postgresql://annexevoice:annexevoice@localhost:5433/annexevoice" -f scripts/verify-rls-isolation.sql
```

## Try the full flow
With the API and the worker running (`pnpm dev`):

1. Request an OTP:
   ```bash
   curl -X POST http://localhost:3000/v1/auth/otp/request \
     -H 'content-type: application/json' \
     -d '{"phone":"+2348012345001"}'
   # → {"status":"issued","devCode":"123456"}
   ```
2. Verify and capture `accessToken`:
   ```bash
   curl -X POST http://localhost:3000/v1/auth/otp/verify \
     -H 'content-type: application/json' \
     -d '{"phone":"+2348012345001","code":"123456"}'
   ```
3. Draft and issue an invoice:
   ```bash
   curl -X POST http://localhost:3000/v1/invoices \
     -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
     -d '{"customerId":"<customer-uuid>","lines":[{"description":"Cement","unitPriceKobo":950000,"quantity":50}]}'
   # → DRAFT invoice with VAT/total
   curl -X POST http://localhost:3000/v1/invoices/<invoice-id>/issue \
     -H "authorization: Bearer $TOKEN"
   # → PENDING_TRANSMISSION, number assigned
   ```
4. Worker picks it up and marks it TRANSMITTED with a MOCK IRN. Check:
   ```bash
   curl -H "authorization: Bearer $TOKEN" http://localhost:3000/v1/invoices/<id>
   ```

## Testing WhatsApp inbound
```bash
PAYLOAD='{"entry":[{"changes":[{"value":{"messages":[{"id":"wamid.X","from":"2348012345001","type":"text","text":{"body":"invoice Aisha Bello 20 cartons noodles @1850"},"timestamp":"1794597800"}]}}]}]}'
SIG=$(python3 -c "import hmac,hashlib,sys; print('sha256=' + hmac.new(b'$WHATSAPP_APP_SECRET', sys.argv[1].encode(), hashlib.sha256).hexdigest())" "$PAYLOAD")
curl -X POST http://localhost:3000/v1/webhooks/whatsapp \
  -H "x-hub-signature-256: $SIG" -H 'content-type: application/json' \
  --data-binary "$PAYLOAD"
```
Set `WHATSAPP_PROVIDER=meta` and `WHATSAPP_APP_SECRET=…` for signature verification. In `mock` mode the signature check is always true.

## Testing Paystack webhook
```bash
PAYLOAD='{"event":"charge.success","data":{"reference":"ps-X","amount":1075000,"metadata":{"tenantId":"<tenantId>","invoiceId":"<invoiceId>"}}}'
SIG=$(python3 -c "import hmac,hashlib,sys; print(hmac.new(b'$PAYSTACK_WEBHOOK_SECRET', sys.argv[1].encode(), hashlib.sha512).hexdigest())" "$PAYLOAD")
curl -X POST http://localhost:3000/v1/webhooks/paystack \
  -H "x-paystack-signature: $SIG" -H 'content-type: application/json' \
  --data-binary "$PAYLOAD"
```

## Gotchas we hit
- **Webhook signature mismatch** → NestFactory needs `rawBody: true`. Already enabled in `apps/api/src/main.ts`.
- **BigInt serialization errors** → `BigIntSerializerInterceptor` is globally installed in main.ts.
- **`Custom Id cannot contain :`** from BullMQ → job IDs must use `-` not `:`.
- **RLS "new row violates" on webhooks** → use `TenantScope.run(tenantId, …)`, don't call `.runAsAdmin` unless the role actually has `BYPASSRLS`.
- **psql rejects `?schema=public`** → strip query params before handing a URL to `psql`. The Prisma client doesn't care.
- **class-validator vs class-transformer for BigInt** → validate numbers at the controller edge; convert to BigInt in the controller body before calling the service. `@Transform` runs *after* `@IsInt`.

## Useful commands
```bash
pnpm dev                         # all four apps
pnpm --filter @annexevoice/tax-engine test
pnpm --filter @annexevoice/api  test
pnpm --filter @annexevoice/api  exec prisma studio     # browse the DB
pnpm --filter @annexevoice/api  db:seed                # (re-)seed
pnpm api:generate                # regenerate @annexevoice/api-client from OpenAPI
bash scripts/smoke.sh            # end-to-end smoke
```
