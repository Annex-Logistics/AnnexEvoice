export const EInvoiceProviderToken = Symbol('EInvoiceProvider');

export interface EInvoiceSubmissionRequest {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  issuedAt: Date;
  seller: { legalName: string; tin: string | null };
  buyer: { name: string; tin: string | null; phone: string | null; email: string | null };
  currency: 'NGN';
  subtotalKobo: bigint;
  vatKobo: bigint;
  whtKobo: bigint;
  totalKobo: bigint;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceKobo: bigint;
    lineTotalKobo: bigint;
    vatKobo: bigint;
  }>;
  idempotencyKey: string;
}

export type EInvoiceSubmissionResult =
  | {
      status: 'succeeded';
      irn: string;
      qrPayload: string;
      provider: string;
      rawResponse?: unknown;
    }
  | {
      status: 'transient_failed' | 'permanent_failed';
      provider: string;
      reason: string;
      rawResponse?: unknown;
    };

export interface EInvoiceStatusResult {
  status: 'pending' | 'succeeded' | 'failed';
  irn?: string;
  qrPayload?: string;
  reason?: string;
}

export interface EInvoiceProvider {
  readonly name: string;
  submit(request: EInvoiceSubmissionRequest): Promise<EInvoiceSubmissionResult>;
  getStatus(submissionId: string): Promise<EInvoiceStatusResult>;
  cancel(submissionId: string): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; info?: Record<string, unknown> }>;
}
