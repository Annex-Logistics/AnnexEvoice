import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantScope } from '../../prisma/tenant-scope.js';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TenantScope,
  ) {}

  async getById(tenantId: string) {
    return this.scope.run(tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException();
      return tenant;
    });
  }

  async update(tenantId: string, data: { tradingName?: string; address?: string; email?: string }) {
    return this.scope.run(tenantId, async (tx) => tx.tenant.update({ where: { id: tenantId }, data }));
  }
}
