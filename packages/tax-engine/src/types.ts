import { z } from 'zod';

import type { Kobo } from './money.js';

export type TaxRuleKind = 'VAT' | 'WHT' | 'EXEMPT' | 'ZERO_RATED';

export interface TaxRule {
  id: string;
  kind: TaxRuleKind;
  name: string;
  /** Basis points: 750 = 7.5%. Must be 0 for EXEMPT / ZERO_RATED. */
  rateBps: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface InvoiceLineInput {
  description: string;
  unitPriceKobo: Kobo;
  quantity: number;
  /** Rule applied per line. Fall back to invoice-level default if absent. */
  taxRuleId?: string;
}

export interface CalculateInvoiceInput {
  issuedAt: Date;
  lines: InvoiceLineInput[];
  /** Optional invoice-level WHT applied to the subtotal after VAT. */
  whtRuleId?: string;
  /** All rules available in the tenant's tax catalogue. */
  taxRules: TaxRule[];
  /** Default VAT rule when a line has no explicit rule. */
  defaultVatRuleId?: string;
}

export interface CalculatedLine {
  description: string;
  quantity: number;
  unitPriceKobo: Kobo;
  lineSubtotalKobo: Kobo;
  taxRuleId?: string;
  vatKobo: Kobo;
}

export interface CalculatedInvoice {
  lines: CalculatedLine[];
  subtotalKobo: Kobo;
  vatKobo: Kobo;
  whtKobo: Kobo;
  totalKobo: Kobo;
  appliedRules: {
    vat: Record<string, TaxRule>;
    wht?: TaxRule;
  };
}

export const invoiceLineInputSchema = z.object({
  description: z.string().min(1),
  unitPriceKobo: z.bigint().nonnegative(),
  quantity: z.number().int().positive(),
  taxRuleId: z.string().uuid().optional(),
});

export const calculateInvoiceInputSchema = z.object({
  issuedAt: z.date(),
  lines: z.array(invoiceLineInputSchema).min(1),
  whtRuleId: z.string().uuid().optional(),
  defaultVatRuleId: z.string().uuid().optional(),
  taxRules: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['VAT', 'WHT', 'EXEMPT', 'ZERO_RATED']),
      name: z.string(),
      rateBps: z.number().int().min(0).max(10_000),
      effectiveFrom: z.date(),
      effectiveTo: z.date().optional(),
    }),
  ),
});
