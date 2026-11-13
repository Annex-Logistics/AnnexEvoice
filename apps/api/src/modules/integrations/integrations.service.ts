import { Injectable } from '@nestjs/common';
import { IntegrationStatus } from '@prisma/client';

import { TenantScope } from '../../prisma/tenant-scope.js';

export const SUPPORTED_PROVIDERS = [
  'paystack',
  'flutterwave',
  'mono',
  'quickbooks',
  'xero',
  'zoho-books',
  'sage',
  'termii',
  'resend',
  'posthog',
  'sentry',
];

@Injectable()
export class IntegrationsService {
  constructor(private readonly scope: TenantScope) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) => tx.integrationConnection.findMany());
  }

  async upsert(tenantId: string, provider: string, config: Record<string, unknown>) {
    return this.scope.run(tenantId, (tx) =>
      tx.integrationConnection.upsert({
        where: { tenantId_provider: { tenantId, provider } },
        update: { config, status: IntegrationStatus.CONNECTED, connectedAt: new Date() },
        create: { tenantId, provider, config, status: IntegrationStatus.CONNECTED, connectedAt: new Date() },
      }),
    );
  }

  async disconnect(tenantId: string, provider: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.integrationConnection.update({
        where: { tenantId_provider: { tenantId, provider } },
        data: { status: IntegrationStatus.DISCONNECTED },
      }),
    );
  }
}
