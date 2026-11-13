import { describe, expect, it } from 'vitest';

import { parseInvoiceText } from '../src/modules/whatsapp/parser.js';

describe('parseInvoiceText', () => {
  it('parses the canonical example', () => {
    const parsed = parseInvoiceText('invoice Chidi Okafor 50 bags cement @9500');
    expect(parsed).toEqual({
      customerName: 'Chidi Okafor',
      lines: [{ description: 'bags cement', quantity: 50, unitPriceKobo: 950000n }],
    });
  });

  it('accepts comma-formatted price and decimals', () => {
    const parsed = parseInvoiceText('invoice Aisha Bello 3 tins paint @12,500.00');
    expect(parsed?.lines[0]?.unitPriceKobo).toBe(1_250_000n);
  });

  it('returns null for malformed messages', () => {
    expect(parseInvoiceText('hello')).toBeNull();
    expect(parseInvoiceText('invoice ???')).toBeNull();
    expect(parseInvoiceText('invoice Chidi 5 bags cement')).toBeNull();
  });
});
