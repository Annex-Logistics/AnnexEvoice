import { Injectable } from '@nestjs/common';
import type { TaxRule as PrismaTaxRule } from '@prisma/client';

import { TenantScope } from '../../prisma/tenant-scope.js';

import type { TaxRule } from '@annexevoice/tax-engine';

@Injectable()
export class TaxService {
  constructor(private readonly scope: TenantScope) {}

  listRules(tenantId: string): Promise<PrismaTaxRule[]> {
    return this.scope.run(tenantId, (tx) => tx.taxRule.findMany({ orderBy: { effectiveFrom: 'desc' } }));
  }

  async rulesForEngine(tenantId: string): Promise<TaxRule[]> {
    const rules = await this.listRules(tenantId);
    return rules.map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      rateBps: r.rateBps,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo ?? undefined,
    }));
  }

  summary(tenantId: string, periodStart: Date, periodEnd: Date) {
    return this.scope.run(tenantId, async (tx) => {
      const [vat, wht] = await Promise.all([
        tx.invoice.aggregate({
          where: { tenantId, status: { in: ['TRANSMITTED', 'PAID', 'PART_PAID'] }, issuedAt: { gte: periodStart, lt: periodEnd } },
          _sum: { vatKobo: true, whtKobo: true, subtotalKobo: true, totalKobo: true },
          _count: true,
        }),
        tx.invoice.aggregate({
          where: { tenantId, status: 'DRAFT' },
          _count: true,
        }),
      ]);
      return {
        invoiceCount: vat._count ?? 0,
        draftCount: wht._count ?? 0,
        subtotalKobo: (vat._sum.subtotalKobo ?? 0n).toString(),
        vatKobo: (vat._sum.vatKobo ?? 0n).toString(),
        whtKobo: (vat._sum.whtKobo ?? 0n).toString(),
        totalKobo: (vat._sum.totalKobo ?? 0n).toString(),
      };
    });
  }
}
