-- AnnexEvoice RLS policies. Applied after `prisma migrate deploy` by scripts/apply-rls.mjs.
-- Every tenant-scoped table enables RLS and restricts rows by current_setting('app.tenant_id').
-- A privileged `app_admin` role bypasses RLS for admin/reporting endpoints.
-- Column names are Prisma's defaults (camelCase, so we quote them: "tenantId" etc).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- True when the connection is running an admin-scoped query (set by
-- TenantScope.runAsAdmin). Lets the admin module see every tenant without
-- the DB role needing BYPASSRLS.
CREATE OR REPLACE FUNCTION is_admin_scope() RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.is_admin', true) = 'true';
EXCEPTION WHEN others THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'tenants', 'customers', 'products', 'invoices', 'invoice_lines',
    'credit_notes', 'einvoice_submissions', 'payments', 'tax_rules', 'tax_periods',
    'whatsapp_conversations', 'whatsapp_messages', 'subscriptions',
    'audit_events', 'idempotency_keys', 'consents',
    'integration_connections', 'sync_logs', 'webhook_endpoints', 'webhook_deliveries',
    'invoice_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END
$$;

-- Tenant table: the tenant row's own id is the tenant id. Admin scope sees every row.
DROP POLICY IF EXISTS tenants_isolation ON tenants;
CREATE POLICY tenants_isolation ON tenants
  USING (is_admin_scope() OR id = current_tenant_id())
  WITH CHECK (is_admin_scope() OR id = current_tenant_id());

-- All other direct-tenantId tables.
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'customers', 'products', 'invoices', 'credit_notes', 'einvoice_submissions',
    'payments', 'tax_rules', 'tax_periods', 'whatsapp_conversations', 'subscriptions',
    'audit_events', 'consents', 'integration_connections', 'webhook_endpoints'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', tbl || '_isolation', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (is_admin_scope() OR "tenantId" = current_tenant_id()) WITH CHECK (is_admin_scope() OR "tenantId" = current_tenant_id());',
      tbl || '_isolation',
      tbl
    );
  END LOOP;
END
$$;

-- invoice_sequences is keyed by tenantId (PK).
DROP POLICY IF EXISTS invoice_sequences_isolation ON invoice_sequences;
CREATE POLICY invoice_sequences_isolation ON invoice_sequences
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- invoice_lines inherits via invoiceId.
DROP POLICY IF EXISTS invoice_lines_isolation ON invoice_lines;
CREATE POLICY invoice_lines_isolation ON invoice_lines
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = "invoiceId" AND i."tenantId" = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = "invoiceId" AND i."tenantId" = current_tenant_id()));

-- whatsapp_messages inherits via conversation.
DROP POLICY IF EXISTS whatsapp_messages_isolation ON whatsapp_messages;
CREATE POLICY whatsapp_messages_isolation ON whatsapp_messages
  USING (EXISTS (SELECT 1 FROM whatsapp_conversations c WHERE c.id = "conversationId" AND c."tenantId" = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM whatsapp_conversations c WHERE c.id = "conversationId" AND c."tenantId" = current_tenant_id()));

-- sync_logs inherits via connection.
DROP POLICY IF EXISTS sync_logs_isolation ON sync_logs;
CREATE POLICY sync_logs_isolation ON sync_logs
  USING (EXISTS (SELECT 1 FROM integration_connections c WHERE c.id = "connectionId" AND c."tenantId" = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM integration_connections c WHERE c.id = "connectionId" AND c."tenantId" = current_tenant_id()));

-- webhook_deliveries inherits via endpoint.
DROP POLICY IF EXISTS webhook_deliveries_isolation ON webhook_deliveries;
CREATE POLICY webhook_deliveries_isolation ON webhook_deliveries
  USING (EXISTS (SELECT 1 FROM webhook_endpoints e WHERE e.id = "endpointId" AND e."tenantId" = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM webhook_endpoints e WHERE e.id = "endpointId" AND e."tenantId" = current_tenant_id()));

-- idempotency_keys may be tenant-less (webhook-replay checks) or tenant-scoped.
DROP POLICY IF EXISTS idempotency_keys_isolation ON idempotency_keys;
CREATE POLICY idempotency_keys_isolation ON idempotency_keys
  USING ("tenantId" IS NULL OR "tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = current_tenant_id());

-- Admin bypass.
GRANT USAGE ON SCHEMA public TO app_admin;

-- NOTE: granting BYPASSRLS requires a superuser and is NOT part of the normal
-- migration. The DBA runs this once at setup:
--   ALTER ROLE app_admin BYPASSRLS;
-- The application role (annexevoice) never has BYPASSRLS — it always relies
-- on current_tenant_id() being set via TenantScope.
