import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

const NUMBER_PREFIX = 'INV';
const NUMBER_WIDTH = 6;

@Injectable()
export class InvoiceNumberService {
  /**
   * Allocate the next gapless invoice number for a tenant. Must be called inside the
   * same transaction that issues the invoice so the sequence lock and the invoice
   * write succeed or roll back together.
   */
  async nextNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    const rows = await tx.$queryRaw<{ next_number: bigint }[]>`
      UPDATE invoice_sequences
      SET "nextNumber" = "nextNumber" + 1
      WHERE "tenantId" = ${tenantId}::uuid
      RETURNING "nextNumber" - 1 AS next_number
    `;
    const row = rows[0];
    if (!row) {
      await tx.$executeRaw`INSERT INTO invoice_sequences ("tenantId", "nextNumber") VALUES (${tenantId}::uuid, 2)`;
      return format(1n);
    }
    return format(row.next_number);
  }
}

function format(n: bigint): string {
  return `${NUMBER_PREFIX}-${n.toString().padStart(NUMBER_WIDTH, '0')}`;
}
