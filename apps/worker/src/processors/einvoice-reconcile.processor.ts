import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubmissionStatus } from '@prisma/client';
import type { Job } from 'bullmq';

import { PrismaService } from '../prisma.service.js';

@Processor('einvoice-reconcile')
export class EInvoiceReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(EInvoiceReconcileProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(_job: Job): Promise<unknown> {
    const pending = await this.prisma.eInvoiceSubmission.findMany({
      where: { status: { in: [SubmissionStatus.PENDING, SubmissionStatus.IN_PROGRESS] }, createdAt: { lt: new Date(Date.now() - 5 * 60_000) } },
      take: 100,
    });
    this.logger.log(`Reconciling ${pending.length} pending submissions`);
    // In MockProvider mode there is nothing to query; real APP adapter implements getStatus().
    return { reconciled: pending.length };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduleReconcile() {
    // Placeholder — in the real build we'd push a job to this queue from BullMQ repeatable.
    this.logger.debug('reconciliation tick');
  }
}
