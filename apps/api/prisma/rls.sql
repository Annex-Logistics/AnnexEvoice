-- AnnexEvoice RLS policies. Applied after `prisma migrate deploy` by scripts/apply-rls.mjs.
-- Every tenant-scoped table enables RLS and restricts rows by current_setting('app.tenant_id').
-- A privileged `app_admin` role bypasses RLS for admin/reporting endpoints.

-- Ensure the app role exists in dev; in production create it manually with a strong password
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin;
  END IF;
END
$$;

-- Helper: fetch current tenant id from the GUC; NULL if not set
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS and set FORCE so even the table owner respects policies
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

-- Tenant table: the tenant row itself is tenant_id = id
DROP POLICY IF EXISTS tenants_isolation ON tenants;
CREATE POLICY tenants_isolation ON tenants
  USING (id = current_tenant_id())
  WITH CHECK (id = current_tenant_id());

-- All other tables: match tenant_id column
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'customers', 'products', 'invoices', 'credit_notes', 'einvoice_submissions',
    'payments', 'tax_rules', 'tax_periods', 'whatsapp_conversations', 'subscriptions',
    'audit_events', 'consents', 'integration_connections', 'webhook_endpoints',
    'invoice_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', tbl || '_isolation', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());',
      tbl || '_isolation',
      tbl
    );
  END LOOP;
END
$$;

-- invoice_lines inherits via invoice_id
DROP POLICY IF EXISTS invoice_lines_isolation ON invoice_lines;
CREATE POLICY invoice_lines_isolation ON invoice_lines
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.tenant_id = current_tenant_id()));

-- whatsapp_messages inherits via conversation
DROP POLICY IF EXISTS whatsapp_messages_isolation ON whatsapp_messages;
CREATE POLICY whatsapp_messages_isolation ON whatsapp_messages
  USING (EXISTS (SELECT 1 FROM whatsapp_conversations c WHERE c.id = conversation_id AND c.tenant_id = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM whatsapp_conversations c WHERE c.id = conversation_id AND c.tenant_id = current_tenant_id()));

-- sync_logs inherits via connection
DROP POLICY IF EXISTS sync_logs_isolation ON sync_logs;
CREATE POLICY sync_logs_isolation ON sync_logs
  USING (EXISTS (SELECT 1 FROM integration_connections c WHERE c.id = connection_id AND c.tenant_id = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM integration_connections c WHERE c.id = connection_id AND c.tenant_id = current_tenant_id()));

-- webhook_deliveries inherits via endpoint
DROP POLICY IF EXISTS webhook_deliveries_isolation ON webhook_deliveries;
CREATE POLICY webhook_deliveries_isolation ON webhook_deliveries
  USING (EXISTS (SELECT 1 FROM webhook_endpoints e WHERE e.id = endpoint_id AND e.tenant_id = current_tenant_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM webhook_endpoints e WHERE e.id = endpoint_id AND e.tenant_id = current_tenant_id()));

-- idempotency_keys may be tenant-less (webhook replay checks) or tenant-scoped
DROP POLICY IF EXISTS idempotency_keys_isolation ON idempotency_keys;
CREATE POLICY idempotency_keys_isolation ON idempotency_keys
  USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
  WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- Admin bypass: the app_admin role sees everything (used by admin + webhooks before tenant is known)
GRANT USAGE ON SCHEMA public TO app_admin;
ALTER ROLE app_admin BYPASSRLS;
