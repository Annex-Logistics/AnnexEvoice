import { Injectable } from '@nestjs/common';

import { TenantScope } from '../../prisma/tenant-scope.js';

@Injectable()
export class AdminService {
  constructor(private readonly scope: TenantScope) {}

  listTenants() {
    return this.scope.runAsAdmin((tx) => tx.tenant.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  dlqSubmissions() {
    return this.scope.runAsAdmin((tx) =>
      tx.eInvoiceSubmission.findMany({
        where: { status: { in: ['TRANSIENT_FAILED', 'PERMANENT_FAILED', 'DLQ'] } },
        orderBy: { lastAttemptAt: 'desc' },
        include: { invoice: true, tenant: true },
      }),
    );
  }

  integrationHealth() {
    return this.scope.runAsAdmin(async (tx) => {
      const [tenants, connections, submissions] = await Promise.all([
        tx.tenant.count(),
        tx.integrationConnection.groupBy({ by: ['provider', 'status'], _count: true }),
        tx.eInvoiceSubmission.groupBy({ by: ['status'], _count: true }),
      ]);
      return { tenants, connections, submissions };
    });
  }
}
