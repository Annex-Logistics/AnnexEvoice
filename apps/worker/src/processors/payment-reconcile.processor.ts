import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import type { Job } from 'bullmq';

import { PrismaService } from '../prisma.service.js';

export interface PaymentReconcileJob {
  paymentId: string;
}

@Processor('payment-reconcile')
export class PaymentReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentReconcileProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<PaymentReconcileJob>): Promise<unknown> {
    const payment = await this.prisma.payment.findUnique({ where: { id: job.data.paymentId } });
    if (!payment) return { skipped: true };
    if (!payment.invoiceId) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.UNMATCHED } });
      return { unmatched: true };
    }
    const invoice = await this.prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
    if (!invoice) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.UNMATCHED } });
      return { unmatched: true };
    }
    const newPaid = invoice.amountPaidKobo + payment.amountKobo;
    let status = invoice.status;
    if (newPaid >= invoice.totalKobo) status = InvoiceStatus.PAID;
    else if (newPaid > 0n) status = InvoiceStatus.PART_PAID;
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, receivedAt: new Date() },
      }),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { amountPaidKobo: newPaid, status },
      }),
      this.prisma.auditEvent.create({
        data: { tenantId: payment.tenantId, action: 'payment.reconciled', entity: 'invoice', entityId: invoice.id, after: { paid: newPaid.toString(), status } },
      }),
    ]);
    this.logger.log(`[reconcile] invoice ${invoice.id} → ${status}`);
    return { status };
  }
}
