export type Kobo = bigint;

export const ZERO: Kobo = 0n;
export const KOBO_PER_NAIRA = 100n;

export function nairaToKobo(naira: number | string): Kobo {
  const str = typeof naira === 'number' ? naira.toFixed(2) : naira;
  const normalized = str.trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid naira amount: ${naira}`);
  }
  const [whole, fraction = ''] = normalized.split('.');
  const paddedFraction = (fraction + '00').slice(0, 2);
  return BigInt(whole) * KOBO_PER_NAIRA + (whole!.startsWith('-') ? -BigInt(paddedFraction) : BigInt(paddedFraction));
}

export function koboToNaira(kobo: Kobo): string {
  const negative = kobo < 0n;
  const abs = negative ? -kobo : kobo;
  const whole = abs / KOBO_PER_NAIRA;
  const fraction = abs % KOBO_PER_NAIRA;
  const fractionStr = fraction.toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole.toString()}.${fractionStr}`;
}

export function formatKoboAsNGN(kobo: Kobo): string {
  const naira = koboToNaira(kobo);
  const [whole, fraction] = naira.split('.');
  const withCommas = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₦${withCommas}.${fraction}`;
}

/**
 * Half-up rounding at kobo scale. Used only when converting a rate application
 * (basis points) back to a whole number of kobo.
 */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('Divide by zero');
  const negative = (numerator < 0n) !== (denominator < 0n);
  const absN = numerator < 0n ? -numerator : numerator;
  const absD = denominator < 0n ? -denominator : denominator;
  const quotient = absN / absD;
  const remainder = absN % absD;
  const rounded = remainder * 2n >= absD ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * Apply a rate in basis points to a kobo amount.
 * 750 bps on ₦100 (10000 kobo) = 750 kobo.
 */
export function applyBps(amount: Kobo, bps: number): Kobo {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new Error(`Invalid basis points: ${bps}`);
  }
  return roundHalfUp(amount * BigInt(bps), 10_000n);
}

export function sumKobo(values: readonly Kobo[]): Kobo {
  return values.reduce((acc, v) => acc + v, ZERO);
}
