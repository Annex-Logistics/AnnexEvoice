import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { TenantScope } from '../../prisma/tenant-scope.js';

import { EInvoiceProviderToken, type EInvoiceProvider } from './providers/einvoice.provider.js';

@Injectable()
export class EInvoiceService {
  constructor(
    private readonly scope: TenantScope,
    @Inject(EInvoiceProviderToken) private readonly provider: EInvoiceProvider,
    @InjectQueue('einvoice-submit') private readonly submitQueue: Queue,
  ) {}

  listSubmissions(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.eInvoiceSubmission.findMany({ orderBy: { createdAt: 'desc' }, include: { invoice: true } }),
    );
  }

  async retrySubmission(tenantId: string, submissionId: string) {
    return this.scope.run(tenantId, async (tx) => {
      const sub = await tx.eInvoiceSubmission.findFirst({ where: { id: submissionId, tenantId } });
      if (!sub) throw new NotFoundException();
      await this.submitQueue.add(
        'submit',
        { tenantId, invoiceId: sub.invoiceId, idempotencyKey: sub.idempotencyKey ?? `${tenantId}:${sub.invoiceId}` },
        { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } },
      );
      return { queued: true };
    });
  }

  providerHealth() {
    return this.provider.healthCheck();
  }
}
