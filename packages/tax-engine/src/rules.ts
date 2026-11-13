import type { TaxRule } from './types.js';

export function findActiveRule(rules: readonly TaxRule[], id: string, at: Date): TaxRule | undefined {
  const rule = rules.find((r) => r.id === id);
  if (!rule) return undefined;
  if (rule.effectiveFrom > at) return undefined;
  if (rule.effectiveTo && rule.effectiveTo <= at) return undefined;
  return rule;
}

export function isTaxable(rule: TaxRule | undefined): boolean {
  if (!rule) return false;
  return rule.kind === 'VAT';
}

export function isExempt(rule: TaxRule | undefined): boolean {
  return rule?.kind === 'EXEMPT' || rule?.kind === 'ZERO_RATED';
}
