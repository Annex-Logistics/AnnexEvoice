# RESUME.md — exact commands to pick up where this session left off

## 1. Clone and install
```bash
git clone https://github.com/Annex-Logistics/AnnexEvoice.git
cd AnnexEvoice
corepack enable && corepack prepare pnpm@9.12.0 --activate
pnpm install
```

## 2. Start Postgres 16 and Redis 7

### Option A — Docker (recommended if you have Docker)
```bash
docker compose -f infra/compose/docker-compose.dev.yml up -d
```
Uses the standard ports 5432 and 6379. Set in `.env`:
```
DATABASE_URL=postgresql://annexevoice:annexevoice@localhost:5432/annexevoice?schema=public
REDIS_URL=redis://localhost:6379
```

### Option B — Native (no Docker; what this session used)
```bash
# Postgres
export PGDATA=/var/lib/postgresql/16/annexevoice
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D "$PGDATA" --auth-local=trust --auth-host=trust
echo "unix_socket_directories='$PGDATA'" | sudo -u postgres tee -a "$PGDATA/postgresql.conf"
echo "port=5433"                          | sudo -u postgres tee -a "$PGDATA/postgresql.conf"
sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" -l "$PGDATA/log" start

# Role + database. NOT superuser. (Grant CREATEDB so prisma migrate dev can make
# its shadow database.)
sudo -u postgres psql -h "$PGDATA" -p 5433 -c "CREATE USER annexevoice PASSWORD 'annexevoice' CREATEDB;"
sudo -u postgres psql -h "$PGDATA" -p 5433 -c "CREATE DATABASE annexevoice OWNER annexevoice;"
# rls.sql references app_admin; only a superuser can create it, so do it once here.
sudo -u postgres psql -h "$PGDATA" -p 5433 -d annexevoice -c "CREATE ROLE app_admin; ALTER ROLE app_admin BYPASSRLS;"

# Redis
redis-server --daemonize yes --port 6380
```
Then `.env`:
```
DATABASE_URL=postgresql://annexevoice:annexevoice@localhost:5433/annexevoice?schema=public
REDIS_URL=redis://localhost:6380
```

### Option C — Windows, no Docker
Unzip the EDB PostgreSQL 16 "binaries" zip and a `redis-windows/redis-windows`
release somewhere outside the repo, then:
```bash
initdb -D ~/tools/pgdata -U postgres --auth=trust -E UTF8
echo "port=5433" >> ~/tools/pgdata/postgresql.conf
pg_ctl -D ~/tools/pgdata -l ~/tools/pg.log start
psql -h localhost -p 5433 -U postgres -c "CREATE USER annexevoice PASSWORD 'annexevoice' CREATEDB;" -c "CREATE DATABASE annexevoice OWNER annexevoice;"
psql -h localhost -p 5433 -U postgres -d annexevoice -c "CREATE ROLE app_admin; ALTER ROLE app_admin BYPASSRLS;"
redis-server.exe --port 6380 --save ""
```
Same `.env` values as Option B. Nothing in the apps loads `.env` itself, so
export it into the shell first: `set -a && . ./.env && set +a`.
`scripts/smoke.sh` also needs `jq` and a real `python3` on PATH.

## 3. The rest of `.env`
Either copy `.env.example` and edit, or paste the exact dev set this session used:
```bash
cat > .env <<'EOF'
NODE_ENV=development
TZ=Africa/Lagos
APP_BASE_URL=http://localhost:5173
ADMIN_BASE_URL=http://localhost:5174
API_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://annexevoice:annexevoice@localhost:5433/annexevoice?schema=public
REDIS_URL=redis://localhost:6380
JWT_ACCESS_SECRET=dev-access-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
PII_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
EINVOICE_PROVIDER=mock
WHATSAPP_PROVIDER=mock
PAYMENT_PROVIDER=mock
SMS_PROVIDER=mock
EMAIL_PROVIDER=mock
WHATSAPP_VERIFY_TOKEN=dev-verify-token
EOF
```
`PII_ENCRYPTION_KEY` **must** decode to 32 bytes base64.

## 4. Migrate + apply RLS + seed
```bash
pnpm --filter @annexevoice/api exec prisma migrate dev
node apps/api/scripts/apply-rls.mjs
pnpm --filter @annexevoice/api db:seed
```
If you want cross-tenant admin access to work, promote the Acme owner:
```sql
BEGIN;
SELECT set_config('app.tenant_id', (SELECT id::text FROM tenants WHERE "legalName"='Acme Supplies Nigeria Ltd'), true);
UPDATE memberships SET role='ADMIN' WHERE "userId"=(SELECT id FROM users WHERE phone='+2348012345001');
COMMIT;
```

## 5. Boot the stack
Build once, then run:
```bash
pnpm build
# Terminal 1
(cd apps/api    && node dist/src/main.js)
# Terminal 2
(cd apps/worker && node dist/main.js)
# Terminal 3 (optional, for the frontends)
pnpm --filter @annexevoice/web   preview --host 0.0.0.0
pnpm --filter @annexevoice/admin preview --host 0.0.0.0 --port 4175
```
Or in watch mode on a single machine: `pnpm dev`.

## 6. Verify
```bash
bash scripts/smoke.sh
# → 18 green checks

psql "$DATABASE_URL" -f scripts/verify-rls-isolation.sql
# → confirms RLS tenant isolation and rejection of cross-tenant INSERT
```

## 7. Where to go next
Open `build-instructions/NEXT.md` and pick a top item.
