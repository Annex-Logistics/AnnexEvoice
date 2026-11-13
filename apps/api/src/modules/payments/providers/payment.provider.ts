export const PaymentProviderToken = Symbol('PaymentProvider');

export interface CreatePaymentLinkRequest {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountKobo: bigint;
  currency: 'NGN';
  customer: { name: string; email?: string | null; phone?: string | null };
  callbackUrl: string;
}

export interface CreatePaymentLinkResult {
  provider: string;
  reference: string;
  url: string;
}

export interface VerifyPaymentResult {
  reference: string;
  status: 'succeeded' | 'failed' | 'pending';
  amountKobo: bigint;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
  healthCheck(): Promise<{ ok: boolean; info?: Record<string, unknown> }>;
}
