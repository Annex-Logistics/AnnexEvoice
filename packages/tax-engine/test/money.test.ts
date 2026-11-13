import { describe, expect, it } from 'vitest';

import { applyBps, formatKoboAsNGN, koboToNaira, nairaToKobo, roundHalfUp, sumKobo } from '../src/money';

describe('money', () => {
  it('parses naira to kobo', () => {
    expect(nairaToKobo('100')).toBe(10_000n);
    expect(nairaToKobo('1.5')).toBe(150n);
    expect(nairaToKobo(2.99)).toBe(299n);
    expect(nairaToKobo('0.01')).toBe(1n);
  });

  it('rejects invalid naira', () => {
    expect(() => nairaToKobo('abc')).toThrow();
    expect(() => nairaToKobo('1.234')).toThrow();
  });

  it('formats kobo to naira string', () => {
    expect(koboToNaira(0n)).toBe('0.00');
    expect(koboToNaira(10_050n)).toBe('100.50');
    expect(koboToNaira(-250n)).toBe('-2.50');
  });

  it('formats kobo as NGN with thousands separator', () => {
    expect(formatKoboAsNGN(123_456_789n)).toBe('₦1,234,567.89');
    expect(formatKoboAsNGN(0n)).toBe('₦0.00');
  });

  it('applies basis points with half-up rounding', () => {
    expect(applyBps(10_000n, 750)).toBe(750n);
    expect(applyBps(1_333n, 750)).toBe(100n);
    expect(applyBps(1_340n, 750)).toBe(101n);
    expect(applyBps(1_339n, 750)).toBe(100n);
  });

  it('roundHalfUp handles negatives', () => {
    expect(roundHalfUp(-5n, 2n)).toBe(-3n);
    expect(roundHalfUp(5n, 2n)).toBe(3n);
  });

  it('sumKobo handles empty and populated arrays', () => {
    expect(sumKobo([])).toBe(0n);
    expect(sumKobo([1n, 2n, 3n])).toBe(6n);
  });
});
