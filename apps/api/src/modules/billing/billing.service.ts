import { Injectable } from '@nestjs/common';

import { TenantScope } from '../../prisma/tenant-scope.js';

export const PLANS = {
  starter: { code: 'starter', monthlyInvoices: 25, priceKobo: 0n },
  growth: { code: 'growth', monthlyInvoices: 250, priceKobo: 1_000_000n },
  scale: { code: 'scale', monthlyInvoices: 2_500, priceKobo: 5_000_000n },
} as const;

@Injectable()
export class BillingService {
  constructor(private readonly scope: TenantScope) {}

  listPlans() {
    return Object.values(PLANS);
  }

  getSubscription(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.subscription.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async subscribe(tenantId: string, planCode: keyof typeof PLANS) {
    const plan = PLANS[planCode];
    if (!plan) throw new Error('Unknown plan');
    return this.scope.run(tenantId, (tx) =>
      tx.subscription.create({
        data: {
          tenantId,
          planCode: plan.code,
          status: 'TRIALING',
          currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
          provider: 'paystack',
        },
      }),
    );
  }
}
