import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service.js';

/**
 * Runs the provided callback inside a transaction with `app.tenant_id` set,
 * so Prisma queries are filtered by RLS and the tenant_id GUC. Every service
 * that touches tenant data goes through this helper.
 */
@Injectable()
export class TenantScope {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${sanitize(tenantId)}', true)`);
      return fn(tx);
    });
  }

  /**
   * Admin-only. Bypasses RLS (needs the connection to be the app_admin role).
   * Call sparingly from `admin`/webhook paths.
   */
  async runAsAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', true)`);
      return fn(tx);
    });
  }
}

function sanitize(uuid: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) {
    throw new Error(`Invalid tenant id: ${uuid}`);
  }
  return uuid;
}
