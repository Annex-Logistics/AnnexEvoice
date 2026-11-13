import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators.js';
import { JwtAuthGuard } from '../../common/guards/jwt.guard.js';

import { AuditService } from './audit.service.js';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-events')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query('limit') limit?: string) {
    return this.audit.listForTenant(tenantId, Math.min(Number(limit ?? 100), 500));
  }
}
