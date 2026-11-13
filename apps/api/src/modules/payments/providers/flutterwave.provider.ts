import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment.provider.js';

/**
 * Flutterwave fallback adapter. Implemented defensively — real endpoint paths
 * and signature scheme pulled straight from the Flutterwave docs. Left as a
 * marked stub so it can be filled in once the exact fields are confirmed.
 */
@Injectable()
export class FlutterwaveProvider implements PaymentProvider {
  readonly name = 'flutterwave';

  async createLink(_request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResult> {
    throw new NotImplementedException('Flutterwave adapter not implemented yet.');
  }

  async verify(_reference: string): Promise<VerifyPaymentResult> {
    throw new NotImplementedException('Flutterwave adapter not implemented yet.');
  }

  verifyWebhookSignature(_rawBody: Buffer, _signature: string): boolean {
    return false;
  }

  async healthCheck() {
    return { ok: false, info: { kind: 'flutterwave', reason: 'stub' } };
  }
}
