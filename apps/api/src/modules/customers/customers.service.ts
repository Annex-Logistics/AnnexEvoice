import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantScope } from '../../prisma/tenant-scope.js';
import { AuditService } from '../audit/audit.service.js';

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  tin?: string;
  address?: string;
  isVatRegistered?: boolean;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly scope: TenantScope,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) => tx.customer.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  get(tenantId: string, id: string) {
    return this.scope.run(tenantId, async (tx) => {
      const c = await tx.customer.findFirst({ where: { id, tenantId } });
      if (!c) throw new NotFoundException();
      return c;
    });
  }

  async create(tenantId: string, actorUserId: string, input: CustomerInput) {
    return this.scope.run(tenantId, async (tx) => {
      const c = await tx.customer.create({ data: { ...input, tenantId } });
      await this.audit.record(
        { tenantId, actorUserId, action: 'customer.created', entity: 'customer', entityId: c.id, after: c },
        tx,
      );
      return c;
    });
  }

  async update(tenantId: string, actorUserId: string, id: string, input: Partial<CustomerInput>) {
    return this.scope.run(tenantId, async (tx) => {
      const before = await tx.customer.findFirst({ where: { id, tenantId } });
      if (!before) throw new NotFoundException();
      const after = await tx.customer.update({ where: { id }, data: input });
      await this.audit.record(
        { tenantId, actorUserId, action: 'customer.updated', entity: 'customer', entityId: id, before, after },
        tx,
      );
      return after;
    });
  }

  upsertByPhone(tenantId: string, phone: string, name: string) {
    return this.scope.run(tenantId, async (tx) => {
      const existing = await tx.customer.findFirst({ where: { tenantId, phone } });
      if (existing) return existing;
      return tx.customer.create({ data: { tenantId, phone, name } });
    });
  }
}
