import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service.js';

@Injectable()
export class WorkerTenantScope {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      if (!/^[0-9a-f-]{36}$/i.test(tenantId)) throw new Error(`Invalid tenant id ${tenantId}`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${tenantId}', true)`);
      return fn(tx);
    });
  }
}
