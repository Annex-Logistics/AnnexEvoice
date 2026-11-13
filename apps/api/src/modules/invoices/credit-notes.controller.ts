import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import type { AuthenticatedUser } from '../../common/types.js';

import { CreditNotesService } from './credit-notes.service.js';

class CreateCreditNoteDto {
  @IsUUID() invoiceId!: string;
  @IsString() reason!: string;
  @IsInt() @Min(1) totalKobo!: number;
}

@ApiTags('credit-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly notes: CreditNotesService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.notes.list(tenantId);
  }

  @Post()
  create(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateCreditNoteDto) {
    return this.notes.create(tenantId, user.userId, {
      invoiceId: body.invoiceId,
      reason: body.reason,
      totalKobo: BigInt(body.totalKobo),
    });
  }
}
