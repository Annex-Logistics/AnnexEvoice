import { BadRequestException, Controller, Headers, Inject, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../../common/decorators.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import { PaymentsService } from './payments.service.js';
import { PaymentProviderToken, type PaymentProvider } from './providers/payment.provider.js';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
    @Inject(PaymentProviderToken) private readonly provider: PaymentProvider,
  ) {}

  @Post('paystack')
  @Public()
  async paystack(@Req() req: RawBodyRequest<Request>, @Headers('x-paystack-signature') signature: string) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    if (!this.provider.verifyWebhookSignature(raw, signature ?? '')) {
      throw new BadRequestException('Invalid signature');
    }
    const body = req.body as { event?: string; data?: { reference?: string; amount?: number; metadata?: { tenantId?: string; invoiceId?: string } } };
    if (!body?.event?.startsWith('charge.')) return { ok: true, ignored: body?.event };
    const reference = body.data?.reference;
    const amount = body.data?.amount;
    const tenantId = body.data?.metadata?.tenantId;
    const invoiceId = body.data?.metadata?.invoiceId;
    if (!reference || !amount || !tenantId) throw new BadRequestException('Missing fields');

    // dedupe by reference via unique constraint; idempotent re-delivery no-ops
    await this.prisma.idempotencyKey
      .create({ data: { scope: 'paystack:webhook', key: reference } })
      .catch(() => undefined);

    const payment = await this.payments.recordWebhookPayment({
      provider: 'paystack',
      reference,
      tenantId,
      invoiceId,
      amountKobo: BigInt(amount),
      rawPayload: body,
    });
    await this.payments.enqueueReconciliation(payment.id);
    return { ok: true };
  }
}
