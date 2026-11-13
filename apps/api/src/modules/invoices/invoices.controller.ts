import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

import { CurrentUser, TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import type { AuthenticatedUser } from '../../common/types.js';

import { InvoicesService } from './invoices.service.js';

class InvoiceLineDto {
  @IsString() description!: string;
  @IsInt() @Min(0) @Transform(({ value }) => BigInt(value), { toClassOnly: true })
  unitPriceKobo!: bigint;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() taxRuleId?: string;
}

class CreateInvoiceDto {
  @IsUUID() customerId!: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];
  @IsOptional() @IsUUID() whtRuleId?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.invoices.list(tenantId);
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoices.get(tenantId, id);
  }

  @Post()
  createDraft(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateInvoiceDto) {
    return this.invoices.createDraft(tenantId, user.userId, {
      customerId: body.customerId,
      whtRuleId: body.whtRuleId,
      notes: body.notes,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      lines: body.lines.map((l) => ({
        description: l.description,
        unitPriceKobo: l.unitPriceKobo,
        quantity: l.quantity,
        productId: l.productId,
        taxRuleId: l.taxRuleId,
      })),
    });
  }

  @Post(':id/issue')
  issue(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoices.issue(tenantId, user.userId, id);
  }

  @Post(':id/cancel')
  cancel(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoices.cancelDraft(tenantId, user.userId, id);
  }
}
