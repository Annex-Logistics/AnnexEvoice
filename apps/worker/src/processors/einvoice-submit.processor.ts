import { createHash } from 'node:crypto';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InvoiceStatus, SubmissionStatus } from '@prisma/client';
import type { Job } from 'bullmq';

import { PrismaService } from '../prisma.service.js';

export interface EInvoiceSubmitJob {
  tenantId: string;
  invoiceId: string;
  idempotencyKey: string;
}

@Processor('einvoice-submit')
export class EInvoiceSubmitProcessor extends WorkerHost {
  private readonly logger = new Logger(EInvoiceSubmitProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<EInvoiceSubmitJob>): Promise<unknown> {
    const { tenantId, invoiceId, idempotencyKey } = job.data;
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { lines: true, customer: true, tenant: true },
    });
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const seed = createHash('sha256').update(idempotencyKey).digest('hex');
    const irn = `MOCK-${seed.slice(0, 8).toUpperCase()}-${invoice.number ?? invoice.id}`;
    const qrPayload = JSON.stringify({
      irn,
      invoice: invoice.number,
      sellerTin: invoice.tenant.tin ?? 'UNKNOWN',
      totalKobo: invoice.totalKobo.toString(),
      issuedAt: invoice.issuedAt?.toISOString(),
    });

    await this.prisma.$transaction([
      this.prisma.eInvoiceSubmission.update({
        where: { invoiceId },
        data: {
          status: SubmissionStatus.SUCCEEDED,
          provider: process.env.EINVOICE_PROVIDER ?? 'mock',
          irn,
          qrPayload,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.TRANSMITTED,
          irn,
          qrPayload,
          transmittedAt: new Date(),
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          tenantId,
          action: 'invoice.transmitted',
          entity: 'invoice',
          entityId: invoiceId,
          after: { irn },
        },
      }),
    ]);

    // Chain: render PDF, then notify.
    await job.updateProgress(50);
    return { irn };
  }
}
