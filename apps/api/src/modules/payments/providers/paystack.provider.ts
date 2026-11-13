import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResult,
  PaymentProvider,
  VerifyPaymentResult,
} from './payment.provider.js';

/**
 * Paystack adapter. Only uses documented endpoints:
 *   POST /transaction/initialize — returns authorization_url + reference
 *   GET  /transaction/verify/{reference}
 * Webhooks: the raw body is HMAC-SHA512 with the secret key; the `x-paystack-signature`
 * header must match hex-encoded. (See Paystack docs.)
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack';
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly base = 'https://api.paystack.co';

  constructor(config: ConfigService) {
    this.secretKey = config.get<string>('paystack.secretKey') ?? process.env.PAYSTACK_SECRET_KEY ?? '';
    this.webhookSecret = config.get<string>('paystack.webhookSecret') ?? process.env.PAYSTACK_WEBHOOK_SECRET ?? this.secretKey;
  }

  async createLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResult> {
    if (!this.secretKey) throw new Error('PAYSTACK_SECRET_KEY not set');
    const res = await fetch(`${this.base}/transaction/initialize`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.secretKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(request.amountKobo),
        currency: request.currency,
        email: request.customer.email ?? 'buyer@example.ng',
        reference: `${request.tenantId}-${request.invoiceId}`,
        callback_url: request.callbackUrl,
        metadata: {
          tenantId: request.tenantId,
          invoiceId: request.invoiceId,
          invoiceNumber: request.invoiceNumber,
        },
      }),
    });
    if (!res.ok) throw new Error(`Paystack initialize failed: ${res.status}`);
    const data = (await res.json()) as { data: { authorization_url: string; reference: string } };
    return { provider: this.name, reference: data.data.reference, url: data.data.authorization_url };
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    const res = await fetch(`${this.base}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { authorization: `Bearer ${this.secretKey}` },
    });
    if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
    const data = (await res.json()) as { data: { status: string; amount: number } };
    const status = data.data.status === 'success' ? 'succeeded' : data.data.status === 'failed' ? 'failed' : 'pending';
    return { reference, status, amountKobo: BigInt(data.data.amount), raw: data };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    const expected = createHmac('sha512', this.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  async healthCheck() {
    return { ok: Boolean(this.secretKey), info: { kind: 'paystack' } };
  }
}
