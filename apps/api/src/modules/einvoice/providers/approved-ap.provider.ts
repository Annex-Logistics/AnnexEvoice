import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  EInvoiceProvider,
  EInvoiceStatusResult,
  EInvoiceSubmissionRequest,
  EInvoiceSubmissionResult,
} from './einvoice.provider.js';

/**
 * Real Access Point Provider adapter.
 *
 * TODO(nrs-app): populate with the accredited APP's official technical specification.
 *   - Auth: OAuth client-credentials / mTLS / signed JWT ?
 *   - Submit endpoint path + payload schema ?
 *   - Signing algorithm + canonical form ?
 *   - Status callback URL vs polling ?
 *   - Idempotency header name ?
 *   - Error taxonomy (which codes are transient vs permanent) ?
 *
 * Do NOT guess field names or paths. Until the spec arrives this adapter
 * throws, and dev/CI use the MockEInvoiceProvider.
 */
@Injectable()
export class ApprovedApProvider implements EInvoiceProvider {
  readonly name = 'approved-ap';

  async submit(_request: EInvoiceSubmissionRequest): Promise<EInvoiceSubmissionResult> {
    throw new NotImplementedException('Approved APP adapter not implemented. Load the official spec first.');
  }

  async getStatus(_submissionId: string): Promise<EInvoiceStatusResult> {
    throw new NotImplementedException('Approved APP adapter not implemented.');
  }

  async cancel(_submissionId: string): Promise<void> {
    throw new NotImplementedException('Approved APP adapter not implemented.');
  }

  async healthCheck() {
    return { ok: false, info: { kind: 'approved-ap', reason: 'not implemented' } };
  }
}
