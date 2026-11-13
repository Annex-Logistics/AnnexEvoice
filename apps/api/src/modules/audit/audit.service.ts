import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantScope } from '../../prisma/tenant-scope.js';

export interface AuditInput {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TenantScope,
  ) {}

  async record(input: AuditInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    await client.auditEvent.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before as Prisma.InputJsonValue,
        after: input.after as Prisma.InputJsonValue,
      },
    });
  }

  async listForTenant(tenantId: string, limit = 100) {
    return this.scope.run(tenantId, async (tx) =>
      tx.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    );
  }
}
