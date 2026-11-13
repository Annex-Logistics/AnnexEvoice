import { applyBps, sumKobo, ZERO } from './money';
import { findActiveRule, isExempt, isTaxable } from './rules';
import type {
  CalculateInvoiceInput,
  CalculatedInvoice,
  CalculatedLine,
  TaxRule,
} from './types';

export function calculateInvoice(input: CalculateInvoiceInput): CalculatedInvoice {
  const appliedVatRules: Record<string, TaxRule> = {};
  const calculatedLines: CalculatedLine[] = [];

  for (const line of input.lines) {
    if (line.quantity <= 0) throw new Error('Line quantity must be positive');
    if (line.unitPriceKobo < 0n) throw new Error('Line unit price must be non-negative');

    const lineSubtotal = line.unitPriceKobo * BigInt(line.quantity);
    const ruleId = line.taxRuleId ?? input.defaultVatRuleId;
    let vat = ZERO;
    let appliedRuleId: string | undefined;

    if (ruleId) {
      const rule = findActiveRule(input.taxRules, ruleId, input.issuedAt);
      if (!rule) {
        throw new Error(`Tax rule ${ruleId} not active on ${input.issuedAt.toISOString()}`);
      }
      if (isTaxable(rule)) {
        vat = applyBps(lineSubtotal, rule.rateBps);
        appliedVatRules[rule.id] = rule;
        appliedRuleId = rule.id;
      } else if (isExempt(rule)) {
        vat = ZERO;
        appliedRuleId = rule.id;
      } else {
        throw new Error(`Rule ${rule.id} of kind ${rule.kind} cannot apply to a line`);
      }
    }

    calculatedLines.push({
      description: line.description,
      quantity: line.quantity,
      unitPriceKobo: line.unitPriceKobo,
      lineSubtotalKobo: lineSubtotal,
      vatKobo: vat,
      taxRuleId: appliedRuleId,
    });
  }

  const subtotal = sumKobo(calculatedLines.map((l) => l.lineSubtotalKobo));
  const vatTotal = sumKobo(calculatedLines.map((l) => l.vatKobo));

  let whtTotal = ZERO;
  let whtRule: TaxRule | undefined;
  if (input.whtRuleId) {
    const rule = findActiveRule(input.taxRules, input.whtRuleId, input.issuedAt);
    if (!rule) throw new Error(`WHT rule ${input.whtRuleId} not active`);
    if (rule.kind !== 'WHT') throw new Error(`Rule ${rule.id} is not a WHT rule`);
    whtTotal = applyBps(subtotal, rule.rateBps);
    whtRule = rule;
  }

  const total = subtotal + vatTotal - whtTotal;

  return {
    lines: calculatedLines,
    subtotalKobo: subtotal,
    vatKobo: vatTotal,
    whtKobo: whtTotal,
    totalKobo: total,
    appliedRules: {
      vat: appliedVatRules,
      wht: whtRule,
    },
  };
}
