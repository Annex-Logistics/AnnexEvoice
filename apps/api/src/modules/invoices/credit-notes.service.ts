import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreditNoteStatus, InvoiceStatus } from '@prisma/client';

import { TenantScope } from '../../prisma/tenant-scope.js';
import { AuditService } from '../audit/audit.service.js';

import { InvoiceNumberService } from './invoice-number.service.js';

export interface CreateCreditNoteInput {
  invoiceId: string;
  reason: string;
  totalKobo: bigint;
}

@Injectable()
export class CreditNotesService {
  constructor(
    private readonly scope: TenantScope,
    private readonly audit: AuditService,
    private readonly numbering: InvoiceNumberService,
  ) {}

  list(tenantId: string) {
    return this.scope.run(tenantId, (tx) =>
      tx.creditNote.findMany({ orderBy: { createdAt: 'desc' }, include: { invoice: true } }),
    );
  }

  async create(tenantId: string, actorUserId: string | null, input: CreateCreditNoteInput) {
    if (input.totalKobo <= 0n) throw new BadRequestException('totalKobo must be positive');
    if (!input.reason.trim()) throw new BadRequestException('reason is required');

    return this.scope.run(tenantId, async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: input.invoiceId, tenantId } });
      if (!invoice) throw new NotFoundException('invoice');
      if (
        invoice.status !== InvoiceStatus.TRANSMITTED &&
        invoice.status !== InvoiceStatus.PART_PAID &&
        invoice.status !== InvoiceStatus.PAID
      ) {
        throw new ConflictException(
          `Credit note can only be issued against a transmitted invoice (current status: ${invoice.status})`,
        );
      }
      if (input.totalKobo > invoice.totalKobo) {
        throw new BadRequestException('Credit note total cannot exceed invoice total');
      }

      const number = await this.numbering.nextCreditNoteNumber(tx, tenantId);
      const note = await tx.creditNote.create({
        data: {
          tenantId,
          invoiceId: input.invoiceId,
          number,
          reason: input.reason.trim(),
          totalKobo: input.totalKobo,
          status: CreditNoteStatus.PENDING_TRANSMISSION,
          issuedAt: new Date(),
        },
      });
      await this.audit.record(
        {
          tenantId,
          actorUserId: actorUserId ?? undefined,
          action: 'credit-note.issued',
          entity: 'credit_note',
          entityId: note.id,
          after: { invoiceId: input.invoiceId, number, total: input.totalKobo.toString(), reason: input.reason },
        },
        tx,
      );
      return note;
    });
  }
}
