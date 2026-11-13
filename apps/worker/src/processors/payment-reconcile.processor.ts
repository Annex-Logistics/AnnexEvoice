import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import type { Job } from 'bullmq';

import { WorkerTenantScope } from '../tenant-scope.js';

export interface PaymentReconcileJob {
  paymentId: string;
  tenantId: string;
}

@Processor('payment-reconcile')
export class PaymentReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentReconcileProcessor.name);

  constructor(private readonly scope: WorkerTenantScope) {
    super();
  }

  async process(job: Job<PaymentReconcileJob>): Promise<unknown> {
    const { paymentId, tenantId } = job.data;
    return this.scope.run(tenantId, async (tx) => {
      const payment = await tx.payment.findFirst({ where: { id: paymentId, tenantId } });
      if (!payment) return { skipped: true };
      if (!payment.invoiceId) {
        await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.UNMATCHED } });
        return { unmatched: true };
      }
      const invoice = await tx.invoice.findFirst({ where: { id: payment.invoiceId, tenantId } });
      if (!invoice) {
        await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.UNMATCHED } });
        return { unmatched: true };
      }
      const newPaid = invoice.amountPaidKobo + payment.amountKobo;
      let status = invoice.status;
      if (newPaid >= invoice.totalKobo) status = InvoiceStatus.PAID;
      else if (newPaid > 0n) status = InvoiceStatus.PART_PAID;
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, receivedAt: new Date() },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { amountPaidKobo: newPaid, status },
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          action: 'payment.reconciled',
          entity: 'invoice',
          entityId: invoice.id,
          after: { paid: newPaid.toString(), status },
        },
      });
      this.logger.log(`Reconciled invoice ${invoice.number ?? invoice.id} → ${status}`);
      return { status };
    });
  }
}
