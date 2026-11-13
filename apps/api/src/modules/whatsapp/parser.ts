import { z } from 'zod';

export const parsedInvoiceSchema = z.object({
  customerName: z.string().min(1),
  lines: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPriceKobo: z.bigint(),
      }),
    )
    .min(1),
});

export type ParsedInvoice = z.infer<typeof parsedInvoiceSchema>;

/**
 * Rule-based parser for messages of the form:
 *   invoice <Customer Name> <qty> <description...> @<unit price>
 * Example: "invoice Chidi Okafor 50 bags cement @9500"
 * Returns null if the message doesn't match the grammar — the caller then
 * either asks a clarifying question or (if the flag is on) falls back to the LLM.
 */
export function parseInvoiceText(message: string): ParsedInvoice | null {
  const trimmed = message.trim();
  const match = /^invoice\s+([a-zA-Z][a-zA-Z\s.'-]{0,60}?)\s+(\d{1,5})\s+(.+?)\s+@\s*([\d,]+(?:\.\d{1,2})?)\s*$/i.exec(trimmed);
  if (!match) return null;
  const [, customerName, qty, description, priceText] = match;
  const quantity = Number(qty);
  const nairaPrice = Number(priceText!.replace(/,/g, ''));
  if (!Number.isFinite(nairaPrice) || nairaPrice <= 0) return null;
  const unitPriceKobo = BigInt(Math.round(nairaPrice * 100));
  return {
    customerName: customerName!.trim(),
    lines: [{ description: description!.trim(), quantity, unitPriceKobo }],
  };
}
