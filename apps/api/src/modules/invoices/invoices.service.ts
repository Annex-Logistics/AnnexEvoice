import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { Queue } from 'bullmq';

import { TenantScope } from '../../prisma/tenant-scope.js';
import { AuditService } from '../audit/audit.service.js';
import { TaxService } from '../tax/tax.service.js';

import { calculateInvoice } from '@annexevoice/tax-engine';

import { InvoiceNumberService } from './invoice-number.service.js';

export interface InvoiceLineInput {
  description: string;
  unitPriceKobo: bigint;
  quantity: number;
  productId?: string;
  taxRuleId?: string;
}

export interface CreateInvoiceInput {
  customerId: string;
  lines: InvoiceLineInput[];
  whtRuleId?: string;
  dueAt?: Date;
  notes?: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly scope: TenantScope,
    private readonly audit: AuditService,
    private readonly tax: TaxService,
    private readonly numbering: InvoiceNumberService,
    @InjectQueue('einvoice-submit') private readonly submitQueue: Queue,
  ) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.invoice.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: true } }),
    );
  }

  get(tenantId: string, id: string) {
    return this.scope.run(tenantId, async (tx) => {
      const inv = await tx.invoice.findFirst({
        where: { id, tenantId },
        include: { customer: true, lines: true, submission: true, payments: true },
      });
      if (!inv) throw new NotFoundException();
      return inv;
    });
  }

  async createDraft(tenantId: string, actorUserId: string, input: CreateInvoiceInput) {
    if (input.lines.length === 0) throw new BadRequestException('At least one line required');
    const taxRules = await this.tax.rulesForEngine(tenantId);
    const defaultVatRuleId = await this.resolveDefaultVatRule(tenantId);

    const calc = calculateInvoice({
      issuedAt: new Date(),
      taxRules,
      defaultVatRuleId,
      whtRuleId: input.whtRuleId,
      lines: input.lines.map((l) => ({
        description: l.description,
        unitPriceKobo: l.unitPriceKobo,
        quantity: l.quantity,
        taxRuleId: l.taxRuleId,
      })),
    });

    return this.scope.run(tenantId, async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId: input.customerId,
          status: InvoiceStatus.DRAFT,
          subtotalKobo: calc.subtotalKobo,
          vatKobo: calc.vatKobo,
          whtKobo: calc.whtKobo,
          totalKobo: calc.totalKobo,
          dueAt: input.dueAt,
          notes: input.notes,
          lines: {
            create: calc.lines.map((l, i) => ({
              description: l.description,
              quantity: l.quantity,
              unitPriceKobo: l.unitPriceKobo,
              lineTotalKobo: l.lineSubtotalKobo,
              taxRuleId: l.taxRuleId,
              vatKobo: l.vatKobo,
              productId: input.lines[i]?.productId,
            })),
          },
        },
        include: { lines: true },
      });
      await this.audit.record(
        { tenantId, actorUserId, action: 'invoice.drafted', entity: 'invoice', entityId: invoice.id, after: invoice },
        tx,
      );
      return invoice;
    });
  }

  async issue(tenantId: string, actorUserId: string, id: string) {
    return this.scope.run(tenantId, async (tx) => {
      const current = await tx.invoice.findFirst({ where: { id, tenantId } });
      if (!current) throw new NotFoundException();
      if (current.status !== InvoiceStatus.DRAFT) {
        throw new ConflictException(`Cannot issue invoice in status ${current.status}`);
      }
      const number = await this.numbering.nextNumber(tx, tenantId);
      const issued = await tx.invoice.update({
        where: { id },
        data: {
          number,
          status: InvoiceStatus.PENDING_TRANSMISSION,
          issuedAt: new Date(),
        },
      });
      await tx.eInvoiceSubmission.create({
        data: {
          tenantId,
          invoiceId: id,
          provider: 'queued',
          idempotencyKey: `${tenantId}:${id}:${number}`,
        },
      });
      await this.audit.record(
        { tenantId, actorUserId, action: 'invoice.issued', entity: 'invoice', entityId: id, before: current, after: issued },
        tx,
      );
      await this.submitQueue.add(
        'submit',
        { tenantId, invoiceId: id, idempotencyKey: `${tenantId}:${id}:${number}` },
        {
          jobId: `submit:${id}`,
          attempts: 6,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
      return issued;
    });
  }

  async cancelDraft(tenantId: string, actorUserId: string, id: string) {
    return this.scope.run(tenantId, async (tx) => {
      const current = await tx.invoice.findFirst({ where: { id, tenantId } });
      if (!current) throw new NotFoundException();
      if (current.status !== InvoiceStatus.DRAFT) throw new ConflictException('Only drafts can be cancelled');
      const after = await tx.invoice.update({ where: { id }, data: { status: InvoiceStatus.CANCELLED } });
      await this.audit.record(
        { tenantId, actorUserId, action: 'invoice.cancelled', entity: 'invoice', entityId: id, before: current, after },
        tx,
      );
      return after;
    });
  }

  private async resolveDefaultVatRule(tenantId: string): Promise<string | undefined> {
    return this.scope.run(tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      return tenant?.defaultVatRuleId ?? undefined;
    });
  }
}
