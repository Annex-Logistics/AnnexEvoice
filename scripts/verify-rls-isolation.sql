-- AnnexEvoice tenant-isolation proof.
--
-- Run as the application role (annexevoice, no BYPASSRLS):
--   psql "postgresql://annexevoice:annexevoice@localhost:5433/annexevoice" -f scripts/verify-rls-isolation.sql
--
-- Expected output:
--   * With Acme's tenant_id set, SELECT customers returns ONLY Acme rows.
--   * With Baobab's tenant_id set, SELECT customers returns ONLY Baobab rows.
--   * With no tenant_id set, SELECT customers returns 0 rows.
--
-- If any of those is violated, RLS is broken.

\echo '--- 1. no scope set → 0 rows visible ---'
SELECT COUNT(*) AS rows_without_scope FROM customers;

\echo
\echo '--- 2. scope = Acme ---'
BEGIN;
SELECT set_config(
  'app.tenant_id',
  (SELECT id::text FROM tenants WHERE "legalName" = 'Acme Supplies Nigeria Ltd' LIMIT 1),
  true
);
-- The subquery reads the tenants table before the GUC is set, so this depends on
-- the tenants policy letting the row through when current_tenant_id = NULL — it
-- doesn't, so we fall back to passing the id as a parameter in real tests.
SELECT COUNT(*) AS rows_in_acme_scope FROM customers;
COMMIT;

\echo
\echo '--- 3. explicit uuid-based scope ---'
-- Hardcode both tenant UUIDs from the seed so the proof does not depend on the
-- tenants RLS policy letting the subquery through.
-- Replace these if you re-seed.
BEGIN;
SELECT set_config('app.tenant_id', '0130a4b7-c334-4ef4-a9f4-d334c34e2074', true);
\echo 'Acme scope should see Acme rows only:'
SELECT c.name,
       (SELECT "legalName" FROM tenants WHERE id = c."tenantId") AS tenant
FROM customers c
ORDER BY c.name;
COMMIT;

BEGIN;
SELECT set_config('app.tenant_id', '2a7757f3-23b6-4640-82b9-089977289ab8', true);
\echo 'Baobab scope should see Baobab rows only:'
SELECT c.name,
       (SELECT "legalName" FROM tenants WHERE id = c."tenantId") AS tenant
FROM customers c
ORDER BY c.name;
COMMIT;

\echo
\echo '--- 4. integrity: forbidden insert ---'
-- With Acme scope set, try to insert a Baobab row. Expect: ERROR, policy violation.
BEGIN;
SELECT set_config('app.tenant_id', '0130a4b7-c334-4ef4-a9f4-d334c34e2074', true);
\echo 'Attempting to insert a row with Baobab tenantId while in Acme scope:'
INSERT INTO customers (id, "tenantId", name, "isVatRegistered", "createdAt", "updatedAt")
VALUES (gen_random_uuid(),
        '2a7757f3-23b6-4640-82b9-089977289ab8',  -- Baobab
        'Should not be allowed',
        false, now(), now());
ROLLBACK;
