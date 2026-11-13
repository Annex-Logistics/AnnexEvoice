import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

const INVOICE_PREFIX = 'INV';
const CREDIT_NOTE_PREFIX = 'CN';
const NUMBER_WIDTH = 6;

@Injectable()
export class InvoiceNumberService {
  /**
   * Allocate the next gapless invoice number for a tenant. Must be called inside the
   * same transaction that issues the invoice so the sequence lock and the invoice
   * write succeed or roll back together.
   */
  async nextNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    return format(INVOICE_PREFIX, await this.bump(tx, tenantId));
  }

  async nextCreditNoteNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    return format(CREDIT_NOTE_PREFIX, await this.bump(tx, tenantId));
  }

  private async bump(tx: Prisma.TransactionClient, tenantId: string): Promise<bigint> {
    const rows = await tx.$queryRaw<{ next_number: bigint }[]>`
      UPDATE invoice_sequences
      SET "nextNumber" = "nextNumber" + 1
      WHERE "tenantId" = ${tenantId}::uuid
      RETURNING "nextNumber" - 1 AS next_number
    `;
    const row = rows[0];
    if (!row) {
      await tx.$executeRaw`INSERT INTO invoice_sequences ("tenantId", "nextNumber") VALUES (${tenantId}::uuid, 2)`;
      return 1n;
    }
    return row.next_number;
  }
}

function format(prefix: string, n: bigint): string {
  return `${prefix}-${n.toString().padStart(NUMBER_WIDTH, '0')}`;
}
