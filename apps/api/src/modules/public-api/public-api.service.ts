import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { TenantScope } from '../../prisma/tenant-scope.js';

@Injectable()
export class PublicApiService {
  constructor(private readonly scope: TenantScope) {}

  async resolveTenantByKey(apiKey: string): Promise<string | null> {
    const hash = createHash('sha256').update(apiKey).digest('hex');
    return this.scope.runAsAdmin(async (tx) => {
      const rows = await tx.$queryRaw<{ tenantId: string }[]>`
        SELECT "tenantId" FROM integration_connections
        WHERE provider = 'public-api'
          AND config->>'keyHash' = ${hash}
          AND status = 'CONNECTED'
        LIMIT 1
      `;
      return rows[0]?.tenantId ?? null;
    });
  }
}
