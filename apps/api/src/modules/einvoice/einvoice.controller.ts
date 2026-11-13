import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';

import { EInvoiceService } from './einvoice.service.js';

@ApiTags('einvoice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('einvoice')
export class EInvoiceController {
  constructor(private readonly einvoice: EInvoiceService) {}

  @Get('submissions')
  list(@TenantId() tenantId: string) {
    return this.einvoice.listSubmissions(tenantId);
  }

  @Post('submissions/:id/retry')
  retry(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.einvoice.retrySubmission(tenantId, id);
  }

  @Get('provider/health')
  health() {
    return this.einvoice.providerHealth();
  }
}
