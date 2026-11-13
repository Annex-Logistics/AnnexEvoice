import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InvoiceStatus, Role } from '@prisma/client';
import type { Job } from 'bullmq';

import { calculateInvoice, type TaxRule } from '@annexevoice/tax-engine';

import { PrismaService } from '../prisma.service.js';

export interface WhatsappInboundJob {
  tenantId: string;
  waMessageId: string;
  conversationId: string;
}

/**
 * Minimal implementation of the conversation state machine. A full version
 * handles buttons, confirmations, LLM fallback, cancellation, timeout etc.
 */
@Processor('whatsapp-inbound')
export class WhatsappInboundProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappInboundProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<WhatsappInboundJob>): Promise<unknown> {
    const { tenantId, waMessageId } = job.data;
    const message = await this.prisma.whatsappMessage.findUnique({ where: { waMessageId } });
    if (!message?.body) return { skipped: true };

    const parsed = this.parseInvoiceText(message.body);
    if (!parsed) {
      this.logger.log(`Could not parse WhatsApp message ${waMessageId}; would ask clarifying question`);
      return { status: 'ambiguous' };
    }

    const customer = await this.prisma.customer.create({
      data: { tenantId, name: parsed.customerName },
    });

    const taxRules = (await this.prisma.taxRule.findMany({ where: { tenantId } })).map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      rateBps: r.rateBps,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo ?? undefined,
    })) as TaxRule[];

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const calc = calculateInvoice({
      issuedAt: new Date(),
      taxRules,
      defaultVatRuleId: tenant?.defaultVatRuleId ?? undefined,
      lines: parsed.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceKobo: l.unitPriceKobo,
      })),
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        customerId: customer.id,
        status: InvoiceStatus.DRAFT,
        subtotalKobo: calc.subtotalKobo,
        vatKobo: calc.vatKobo,
        totalKobo: calc.totalKobo,
        lines: {
          create: calc.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPriceKobo: l.unitPriceKobo,
            lineTotalKobo: l.lineSubtotalKobo,
            vatKobo: l.vatKobo,
          })),
        },
      },
    });
    this.logger.log(`Drafted invoice ${invoice.id} from WA message ${waMessageId}`);
    // Next step: send summary card via MessagingProvider with Confirm/Edit/Cancel buttons.
    return { invoiceId: invoice.id };
  }

  private parseInvoiceText(text: string) {
    const m = /^invoice\s+([a-zA-Z][a-zA-Z\s.'-]{0,60}?)\s+(\d{1,5})\s+(.+?)\s+@\s*([\d,]+(?:\.\d{1,2})?)\s*$/i.exec(text.trim());
    if (!m) return null;
    const [, name, qty, description, priceText] = m;
    const naira = Number(priceText!.replace(/,/g, ''));
    if (!Number.isFinite(naira) || naira <= 0) return null;
    return {
      customerName: name!.trim(),
      lines: [{ description: description!.trim(), quantity: Number(qty), unitPriceKobo: BigInt(Math.round(naira * 100)) }],
    };
  }
}
