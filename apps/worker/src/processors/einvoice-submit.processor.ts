import { createHash } from 'node:crypto';

import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InvoiceStatus, SubmissionStatus } from '@prisma/client';
import type { Job, Queue } from 'bullmq';

import { WorkerTenantScope } from '../tenant-scope.js';

import type { PdfRenderJob } from './pdf-render.processor.js';

export interface EInvoiceSubmitJob {
  tenantId: string;
  invoiceId: string;
  idempotencyKey: string;
}

@Processor('einvoice-submit')
export class EInvoiceSubmitProcessor extends WorkerHost {
  private readonly logger = new Logger(EInvoiceSubmitProcessor.name);

  constructor(
    private readonly scope: WorkerTenantScope,
    @InjectQueue('pdf-render') private readonly pdfRender: Queue<PdfRenderJob>,
  ) {
    super();
  }

  async process(job: Job<EInvoiceSubmitJob>): Promise<unknown> {
    const { tenantId, invoiceId, idempotencyKey } = job.data;

    const result = await this.scope.run(tenantId, async (tx) => {
      const invoice = await tx.invoice.findFirst({
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

      await tx.eInvoiceSubmission.update({
        where: { invoiceId },
        data: {
          status: SubmissionStatus.SUCCEEDED,
          provider: process.env.EINVOICE_PROVIDER ?? 'mock',
          irn,
          qrPayload,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.TRANSMITTED,
          irn,
          qrPayload,
          transmittedAt: new Date(),
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          action: 'invoice.transmitted',
          entity: 'invoice',
          entityId: invoiceId,
          after: { irn },
        },
      });

      this.logger.log(`Transmitted ${invoice.number ?? invoiceId} → ${irn}`);
      await job.updateProgress(100);
      return { irn };
    });

    // Enqueue only after the transaction commits, or the PDF job can read the pre-TRANSMITTED row.
    await this.pdfRender.add('render', { tenantId, invoiceId }, { jobId: `pdf-${invoiceId}`, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    return result;
  }
}
