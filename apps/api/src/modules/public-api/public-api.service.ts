import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantScope } from '../../prisma/tenant-scope.js';

export interface IssuedKey {
  id: string;
  plaintext: string;
  name: string;
}

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService, private readonly scope: TenantScope) {}

  /** Lookup used by ApiKeyGuard. Runs outside tenant scope by design (RLS is off on api_keys). */
  async resolveTenantByKey(apiKey: string): Promise<string | null> {
    const hash = createHash('sha256').update(apiKey).digest('hex');
    const row = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      select: { tenantId: true, revokedAt: true, id: true },
    });
    if (!row || row.revokedAt) return null;
    this.prisma.apiKey
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return row.tenantId;
  }

  async issueKey(tenantId: string, actorUserId: string | null, name: string): Promise<IssuedKey> {
    const plaintext = `anvx_${randomBytes(24).toString('base64url')}`;
    const keyHash = createHash('sha256').update(plaintext).digest('hex');
    const row = await this.prisma.apiKey.create({
      data: { tenantId, keyHash, name, createdByUser: actorUserId },
    });
    return { id: row.id, plaintext, name };
  }

  async listKeys(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.apiKey.findMany({
        where: { tenantId },
        select: { id: true, name: true, createdAt: true, lastUsedAt: true, revokedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async revokeKey(tenantId: string, id: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
