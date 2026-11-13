import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment.provider.js';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async createLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResult> {
    const reference = `MOCK-${request.invoiceNumber}-${randomBytes(4).toString('hex')}`;
    return {
      provider: this.name,
      reference,
      url: `${request.callbackUrl}?reference=${encodeURIComponent(reference)}&status=succeeded`,
    };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    return { reference, status: 'succeeded', amountKobo: 0n };
  }

  verifyWebhookSignature() {
    return true;
  }

  async healthCheck() {
    return { ok: true, info: { kind: 'mock' } };
  }
}
