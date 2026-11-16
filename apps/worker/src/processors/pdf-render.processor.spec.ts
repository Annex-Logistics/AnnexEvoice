import { describe, expect, it } from 'vitest';

import { buildInvoiceHtml } from './pdf-render.processor.js';

const base = {
  id: 'inv-1',
  number: 'INV-000042',
  irn: 'MOCK-ABCDEF12-INV-000042',
  qrPayload: null,
  issuedAt: new Date('2026-11-15T10:00:00Z'),
  dueAt: null,
  notes: null,
  subtotalKobo: 3_700_000n,
  vatKobo: 277_500n,
  whtKobo: 0n,
  totalKobo: 3_977_500n,
  tenant: { legalName: 'Acme Supplies Nigeria Ltd', tradingName: 'Acme', tin: 'TIN-1', address: null },
  customer: { name: 'Aisha Bello', phone: null, email: null, tin: null, address: null },
  lines: [{ description: 'cartons noodles', quantity: 20, unitPriceKobo: 185_000n, lineTotalKobo: 3_700_000n, vatKobo: 277_500n }],
};

describe('buildInvoiceHtml', () => {
  it('formats kobo amounts exactly', () => {
    const html = buildInvoiceHtml(base, null);
    expect(html).toContain('₦37,000.00');
    expect(html).toContain('₦2,775.00');
    expect(html).toContain('₦39,775.00');
    expect(html).toContain('MOCK-ABCDEF12-INV-000042');
  });

  it('escapes customer-supplied text', () => {
    const html = buildInvoiceHtml(
      { ...base, customer: { ...base.customer, name: `<img src=x onerror="alert('x')">` }, notes: '<script>1</script>' },
      null,
    );
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>1</script>');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
  });

  it('shows WHT only when deducted', () => {
    expect(buildInvoiceHtml(base, null)).not.toContain('WHT deducted');
    const withWht = buildInvoiceHtml({ ...base, whtKobo: 185_000n, totalKobo: 3_792_500n }, null);
    expect(withWht).toContain('WHT deducted');
    expect(withWht).toContain('-₦1,850.00');
  });
});
