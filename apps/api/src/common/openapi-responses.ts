import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Response shapes for OpenAPI only; nothing is validated against these at runtime.
// Kobo amounts are strings on the wire because BigIntSerializerInterceptor
// serialises BigInt with toString().

const ROLES = ['OWNER', 'STAFF', 'ACCOUNTANT', 'ADMIN'] as const;
const KYC_TIERS = ['TIER_0', 'TIER_1', 'TIER_2', 'TIER_3'] as const;
const INVOICE_STATUSES = [
  'DRAFT',
  'PENDING_TRANSMISSION',
  'TRANSMITTED',
  'PART_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;
const SUBMISSION_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'SUCCEEDED',
  'TRANSIENT_FAILED',
  'PERMANENT_FAILED',
  'DLQ',
] as const;

export class OtpRequestResponse {
  @ApiProperty({ example: 'issued' }) status!: string;
  @ApiPropertyOptional({ description: 'Only returned outside production.' }) devCode?: string;
}

export class AuthTokensResponse {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ enum: ROLES, enumName: 'Role' }) role!: (typeof ROLES)[number];
}

export class TenantResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() legalName!: string;
  @ApiProperty({ type: String, nullable: true }) tradingName!: string | null;
  @ApiProperty({ type: String, nullable: true }) tin!: string | null;
  @ApiProperty({ type: String, nullable: true }) rcNumber!: string | null;
  @ApiProperty({ type: String, nullable: true }) phone!: string | null;
  @ApiProperty({ type: String, nullable: true }) email!: string | null;
  @ApiProperty({ type: String, nullable: true }) address!: string | null;
  @ApiProperty({ enum: KYC_TIERS, enumName: 'KycTier' }) kycTier!: (typeof KYC_TIERS)[number];
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) defaultVatRuleId!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class TaxSummaryResponse {
  @ApiProperty() invoiceCount!: number;
  @ApiProperty() draftCount!: number;
  @ApiProperty({ description: 'kobo' }) subtotalKobo!: string;
  @ApiProperty({ description: 'kobo' }) vatKobo!: string;
  @ApiProperty({ description: 'kobo' }) whtKobo!: string;
  @ApiProperty({ description: 'kobo' }) totalKobo!: string;
}

export class CustomerResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) phone!: string | null;
  @ApiProperty({ type: String, nullable: true }) email!: string | null;
  @ApiProperty({ type: String, nullable: true }) tin!: string | null;
  @ApiProperty({ type: String, nullable: true }) address!: string | null;
  @ApiProperty() isVatRegistered!: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ProductResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) sku!: string | null;
  @ApiProperty({ description: 'kobo' }) unitPriceKobo!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) taxRuleId!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class InvoiceLineResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) invoiceId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) productId!: string | null;
  @ApiProperty() description!: string;
  @ApiProperty({ description: 'kobo' }) unitPriceKobo!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ description: 'kobo' }) lineTotalKobo!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) taxRuleId!: string | null;
  @ApiProperty({ description: 'kobo' }) vatKobo!: string;
}

export class EInvoiceSubmissionResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() provider!: string;
  @ApiProperty({ enum: SUBMISSION_STATUSES, enumName: 'SubmissionStatus' })
  status!: (typeof SUBMISSION_STATUSES)[number];
  @ApiProperty() attempts!: number;
  @ApiProperty({ type: String, nullable: true }) irn!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastAttemptAt!: string | null;
}

export class InvoiceResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) customerId!: string;
  @ApiProperty({ type: String, nullable: true, example: 'INV-000001' }) number!: string | null;
  @ApiProperty({ enum: INVOICE_STATUSES, enumName: 'InvoiceStatus' }) status!: (typeof INVOICE_STATUSES)[number];
  @ApiProperty({ description: 'kobo' }) subtotalKobo!: string;
  @ApiProperty({ description: 'kobo' }) vatKobo!: string;
  @ApiProperty({ description: 'kobo' }) whtKobo!: string;
  @ApiProperty({ description: 'kobo' }) totalKobo!: string;
  @ApiProperty({ description: 'kobo' }) amountPaidKobo!: string;
  @ApiProperty({ example: 'NGN' }) currency!: string;
  @ApiProperty({ type: String, nullable: true }) irn!: string | null;
  @ApiProperty({ type: String, nullable: true }) qrPayload!: string | null;
  @ApiProperty({ type: String, nullable: true }) pdfUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) notes!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) issuedAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) transmittedAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) dueAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class InvoiceListItemResponse extends InvoiceResponse {
  @ApiProperty({ type: CustomerResponse }) customer!: CustomerResponse;
}

export class InvoiceDetailResponse extends InvoiceListItemResponse {
  @ApiProperty({ type: [InvoiceLineResponse] }) lines!: InvoiceLineResponse[];
  @ApiProperty({ type: EInvoiceSubmissionResponse, nullable: true })
  submission!: EInvoiceSubmissionResponse | null;
}
