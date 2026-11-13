import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type {
  EInvoiceProvider,
  EInvoiceStatusResult,
  EInvoiceSubmissionRequest,
  EInvoiceSubmissionResult,
} from './einvoice.provider.js';

/**
 * Deterministic mock. Returns a fake IRN and QR payload so the end-to-end
 * flow can be exercised in dev and CI without an accredited APP. Never ship to production.
 */
@Injectable()
export class MockEInvoiceProvider implements EInvoiceProvider {
  readonly name = 'mock';

  async submit(request: EInvoiceSubmissionRequest): Promise<EInvoiceSubmissionResult> {
    const seed = createHash('sha256').update(request.idempotencyKey).digest('hex');
    const irn = `MOCK-${seed.slice(0, 8).toUpperCase()}-${request.invoiceNumber}`;
    const qrPayload = JSON.stringify({
      irn,
      invoice: request.invoiceNumber,
      sellerTin: request.seller.tin ?? 'UNKNOWN',
      totalKobo: request.totalKobo.toString(),
      issuedAt: request.issuedAt.toISOString(),
    });
    return { status: 'succeeded', irn, qrPayload, provider: this.name };
  }

  async getStatus(_submissionId: string): Promise<EInvoiceStatusResult> {
    return { status: 'succeeded' };
  }

  async cancel(_submissionId: string): Promise<void> {
    return;
  }

  async healthCheck() {
    return { ok: true, info: { kind: 'mock' } };
  }
}
