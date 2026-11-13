import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';

import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.payments.list(tenantId);
  }

  @Post('invoices/:id/link')
  createLink(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payments.createLinkForInvoice(tenantId, id);
  }
}
