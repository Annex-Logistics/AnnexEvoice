import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantScope } from '../../prisma/tenant-scope.js';
import { AuditService } from '../audit/audit.service.js';

export interface ProductInput {
  name: string;
  sku?: string;
  unitPriceKobo: bigint;
  taxRuleId?: string;
  active?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly scope: TenantScope,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) => tx.product.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  get(tenantId: string, id: string) {
    return this.scope.run(tenantId, async (tx) => {
      const p = await tx.product.findFirst({ where: { id, tenantId } });
      if (!p) throw new NotFoundException();
      return p;
    });
  }

  async create(tenantId: string, actorUserId: string, input: ProductInput) {
    return this.scope.run(tenantId, async (tx) => {
      const p = await tx.product.create({ data: { ...input, tenantId } });
      await this.audit.record(
        { tenantId, actorUserId, action: 'product.created', entity: 'product', entityId: p.id, after: p },
        tx,
      );
      return p;
    });
  }

  async update(tenantId: string, actorUserId: string, id: string, input: Partial<ProductInput>) {
    return this.scope.run(tenantId, async (tx) => {
      const before = await tx.product.findFirst({ where: { id, tenantId } });
      if (!before) throw new NotFoundException();
      const after = await tx.product.update({ where: { id }, data: input });
      await this.audit.record(
        { tenantId, actorUserId, action: 'product.updated', entity: 'product', entityId: id, before, after },
        tx,
      );
      return after;
    });
  }
}
