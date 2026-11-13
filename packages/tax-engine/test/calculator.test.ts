import { describe, expect, it } from 'vitest';

import { calculateInvoice } from '../src/calculator.js';
import type { TaxRule } from '../src/types.js';

const VAT_STANDARD: TaxRule = {
  id: 'rule-vat-standard',
  kind: 'VAT',
  name: 'VAT 7.5%',
  rateBps: 750,
  effectiveFrom: new Date('2020-02-01T00:00:00Z'),
};

const VAT_EXEMPT: TaxRule = {
  id: 'rule-vat-exempt',
  kind: 'EXEMPT',
  name: 'Exempt',
  rateBps: 0,
  effectiveFrom: new Date('2020-02-01T00:00:00Z'),
};

const WHT_5: TaxRule = {
  id: 'rule-wht-5',
  kind: 'WHT',
  name: 'WHT 5% (services)',
  rateBps: 500,
  effectiveFrom: new Date('2020-01-01T00:00:00Z'),
};

const RULES: TaxRule[] = [VAT_STANDARD, VAT_EXEMPT, WHT_5];
const ISSUED_AT = new Date('2026-11-13T09:00:00Z');

describe('calculateInvoice', () => {
  it('calculates a single-line invoice with VAT', () => {
    const result = calculateInvoice({
      issuedAt: ISSUED_AT,
      taxRules: RULES,
      lines: [
        {
          description: '50 bags cement',
          quantity: 50,
          unitPriceKobo: 950_000n,
          taxRuleId: VAT_STANDARD.id,
        },
      ],
    });
    expect(result.subtotalKobo).toBe(47_500_000n);
    expect(result.vatKobo).toBe(3_562_500n);
    expect(result.whtKobo).toBe(0n);
    expect(result.totalKobo).toBe(51_062_500n);
  });

  it('respects exempt lines', () => {
    const result = calculateInvoice({
      issuedAt: ISSUED_AT,
      taxRules: RULES,
      lines: [
        { description: 'Milk', quantity: 2, unitPriceKobo: 100_000n, taxRuleId: VAT_EXEMPT.id },
      ],
    });
    expect(result.vatKobo).toBe(0n);
    expect(result.totalKobo).toBe(200_000n);
  });

  it('applies WHT on the subtotal, not the VAT-inclusive total', () => {
    const result = calculateInvoice({
      issuedAt: ISSUED_AT,
      taxRules: RULES,
      lines: [
        { description: 'Consulting', quantity: 1, unitPriceKobo: 100_000_00n, taxRuleId: VAT_STANDARD.id },
      ],
      whtRuleId: WHT_5.id,
    });
    expect(result.subtotalKobo).toBe(10_000_000n);
    expect(result.vatKobo).toBe(750_000n);
    expect(result.whtKobo).toBe(500_000n);
    expect(result.totalKobo).toBe(10_250_000n);
  });

  it('uses the default VAT rule when a line has none', () => {
    const result = calculateInvoice({
      issuedAt: ISSUED_AT,
      taxRules: RULES,
      defaultVatRuleId: VAT_STANDARD.id,
      lines: [{ description: 'Widget', quantity: 10, unitPriceKobo: 1_000n }],
    });
    expect(result.vatKobo).toBe(750n);
  });

  it('rejects an invoice-line rule that is not active at issuedAt', () => {
    const futureRule: TaxRule = { ...VAT_STANDARD, id: 'future', effectiveFrom: new Date('2099-01-01') };
    expect(() =>
      calculateInvoice({
        issuedAt: ISSUED_AT,
        taxRules: [futureRule],
        lines: [{ description: 'x', quantity: 1, unitPriceKobo: 1n, taxRuleId: futureRule.id }],
      }),
    ).toThrow(/not active/);
  });

  it('rejects quantities and prices that are invalid', () => {
    expect(() =>
      calculateInvoice({
        issuedAt: ISSUED_AT,
        taxRules: RULES,
        lines: [{ description: 'x', quantity: 0, unitPriceKobo: 100n }],
      }),
    ).toThrow();
    expect(() =>
      calculateInvoice({
        issuedAt: ISSUED_AT,
        taxRules: RULES,
        lines: [{ description: 'x', quantity: 1, unitPriceKobo: -1n }],
      }),
    ).toThrow();
  });
});
