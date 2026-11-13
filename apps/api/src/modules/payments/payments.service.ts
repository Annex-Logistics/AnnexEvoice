import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { TenantScope } from '../../prisma/tenant-scope.js';
import { AuditService } from '../audit/audit.service.js';

import { PaymentProviderToken, type PaymentProvider } from './providers/payment.provider.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly scope: TenantScope,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject(PaymentProviderToken) private readonly provider: PaymentProvider,
    @InjectQueue('payment-reconcile') private readonly reconcileQueue: Queue,
  ) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.payment.findMany({ orderBy: { createdAt: 'desc' }, include: { invoice: true } }),
    );
  }

  async createLinkForInvoice(tenantId: string, invoiceId: string) {
    return this.scope.run(tenantId, async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, tenantId }, include: { customer: true } });
      if (!invoice) throw new NotFoundException();
      const callbackUrl = `${this.config.get<string>('appBaseUrl')}/pay/callback`;
      const link = await this.provider.createLink({
        tenantId,
        invoiceId,
        invoiceNumber: invoice.number ?? invoice.id,
        amountKobo: invoice.totalKobo - invoice.amountPaidKobo,
        currency: 'NGN',
        customer: { name: invoice.customer.name, email: invoice.customer.email, phone: invoice.customer.phone },
        callbackUrl,
      });
      await this.audit.record(
        {
          tenantId,
          action: 'payment-link.created',
          entity: 'invoice',
          entityId: invoiceId,
          after: { reference: link.reference, provider: link.provider },
        },
        tx,
      );
      return link;
    });
  }

  async recordWebhookPayment(input: {
    provider: string;
    reference: string;
    tenantId: string;
    invoiceId?: string;
    amountKobo: bigint;
    rawPayload: unknown;
  }) {
    // Webhook knows which tenant the payment is for from signed metadata;
    // run under that tenant's RLS scope so the insert passes WITH CHECK.
    return this.scope.run(input.tenantId, async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { tenantId: input.tenantId, provider: input.provider, reference: input.reference },
      });
      if (existing) return existing;
      return tx.payment.create({
        data: {
          tenantId: input.tenantId,
          invoiceId: input.invoiceId,
          provider: input.provider,
          reference: input.reference,
          amountKobo: input.amountKobo,
          providerPayload: input.rawPayload as object,
        },
      });
    });
  }

  async enqueueReconciliation(paymentId: string, tenantId: string) {
    await this.reconcileQueue.add(
      'reconcile',
      { paymentId, tenantId },
      { attempts: 5, backoff: { type: 'exponential', delay: 5_000 } },
    );
  }
}
