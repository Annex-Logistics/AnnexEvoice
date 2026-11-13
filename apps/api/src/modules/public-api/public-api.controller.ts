import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators.js';
import { InvoicesService } from '../invoices/invoices.service.js';

import { ApiKeyGuard } from './api-key.guard.js';

@ApiTags('public-api')
@UseGuards(ApiKeyGuard)
@Controller({ path: 'public/invoices', version: '1' })
export class PublicApiController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.invoices.list(tenantId);
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoices.get(tenantId, id);
  }

  @Post(':id/issue')
  issue(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoices.issue(tenantId, 'public-api', id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() body: { customerId: string; lines: Array<{ description: string; unitPriceKobo: string; quantity: number; taxRuleId?: string }>; whtRuleId?: string; notes?: string }) {
    return this.invoices.createDraft(tenantId, 'public-api', {
      customerId: body.customerId,
      whtRuleId: body.whtRuleId,
      notes: body.notes,
      lines: body.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceKobo: BigInt(l.unitPriceKobo),
        taxRuleId: l.taxRuleId,
      })),
    });
  }
}
