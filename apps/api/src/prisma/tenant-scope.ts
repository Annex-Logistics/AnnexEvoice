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
   * Admin scope. Sets `app.is_admin='true'`, which the RLS policies recognize
   * via the `is_admin_scope()` function. The DB role itself doesn't need
   * BYPASSRLS. Only called from the `admin` module (ADMIN role at HTTP) and
   * occasional cross-tenant maintenance jobs.
   */
  async runAsAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', true)`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_admin', 'true', true)`);
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
