import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';
import { TaxSummaryResponse } from '../../common/openapi-responses.js';

import { TaxService } from './tax.service.js';

@ApiTags('tax')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly tax: TaxService) {}

  @Get('rules')
  rules(@TenantId() tenantId: string) {
    return this.tax.listRules(tenantId);
  }

  @Get('summary')
  @ApiQuery({ name: 'from', required: false, description: 'ISO date; defaults to the 1st of this month (UTC)' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date; defaults to one month after from' })
  @ApiOkResponse({ type: TaxSummaryResponse })
  summary(
    @TenantId() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const start = from ? new Date(from) : firstOfMonth();
    const end = to ? new Date(to) : nextMonth(start);
    return this.tax.summary(tenantId, start, end);
  }
}

function firstOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function nextMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
